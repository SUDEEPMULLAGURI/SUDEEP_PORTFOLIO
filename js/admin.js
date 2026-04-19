import { Octokit } from "https://esm.sh/octokit";

// --- CONFIGURATION ---
const REPO_OWNER = 'SUDEEPMULLAGURI';
const REPO_NAME = 'SUDEEP_PORTFOLIO';

// --- ELEMENT REFERENCES ---
const authPanel = document.getElementById('auth-panel');
const editorPanel = document.getElementById('editor-panel');
const tokenInput = document.getElementById('gh-token');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const btnPublish = document.getElementById('btn-publish');
const alertBox = document.getElementById('alert-box');

const inputTitle = document.getElementById('post-title');
const inputSummary = document.getElementById('post-summary');

let octokit = null;
let easyMDE = null;

// --- UTILITIES ---

function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = 'alert ' + (type === 'error' ? 'alert-error' : 'alert-success');
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
}

// UTF-8 friendly base64 encoding/decoding
function utf8ToBase64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}

function createSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

// --- CORE LOGIC ---

async function checkAuth() {
    const token = localStorage.getItem('gh_token');
    if (token) {
        // Use the global Octokit constructor
        octokit = new Octokit({ auth: token });
        try {
            // 1. Verify token by fetching user
            const user = await octokit.rest.users.getAuthenticated();
            
            // 2. Check permissions for the specific repository
            const repoData = await octokit.rest.repos.get({
                owner: REPO_OWNER,
                repo: REPO_NAME
            });

            if (!repoData.data.permissions.push) {
                showAlert(`Authenticated as ${user.data.login}, but YOU DO NOT HAVE WRITE ACCESS to this repo. Check token scopes!`, 'error');
                // We keep them logged in so they can see the error, but maybe hide the editor?
                editorPanel.style.display = 'none';
                authPanel.style.display = 'block';
                return;
            }

            authPanel.style.display = 'none';
            editorPanel.style.display = 'block';
            
            if (!easyMDE) {
                easyMDE = new EasyMDE({ element: document.getElementById('post-content') });
            }
            
            showAlert(`Authenticated as ${user.data.login} (Write Access OK)`, 'success');
        } catch (e) {
            console.error(e);
            if (e.status === 404) {
                showAlert(`Error: Repo ${REPO_OWNER}/${REPO_NAME} not found.`, 'error');
            } else if (e.status === 403) {
                showAlert('Access Denied: Your token cannot even read this repo. Check scopes.', 'error');
            } else {
                localStorage.removeItem('gh_token');
                showAlert('Invalid or expired token.', 'error');
            }
        }
    } else {
        authPanel.style.display = 'block';
        editorPanel.style.display = 'none';
    }
}

btnLogin.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if (token) {
        localStorage.setItem('gh_token', token);
        checkAuth();
    }
});

btnLogout.addEventListener('click', () => {
    localStorage.removeItem('gh_token');
    tokenInput.value = '';
    checkAuth();
});

btnPublish.addEventListener('click', async () => {
    const title = inputTitle.value.trim();
    const summary = inputSummary.value.trim();
    const content = easyMDE.value();

    if (!title || !content) {
        showAlert('Title and Content are required.');
        return;
    }

    const slug = createSlug(title);
    const date = new Date().toISOString();

    btnPublish.disabled = true;
    btnPublish.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

    try {
        // 1. Publish the Markdown File
        const mdPath = `data/posts/${slug}.md`;
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: mdPath,
            message: `Publish blog post: ${title}`,
            content: utf8ToBase64(content)
        });

        // 2. Fetch the current blogs.json to update it
        let blogsIndex = [];
        let indexSha = null;
        
        try {
            const res = await octokit.rest.repos.getContent({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                path: 'data/blogs.json'
            });
            const decodedContent = base64ToUtf8(res.data.content);
            blogsIndex = JSON.parse(decodedContent);
            indexSha = res.data.sha;
        } catch (err) {
            if (err.status !== 404) throw err;
            // If 404, blogs.json doesn't exist yet, we'll create it
        }

        // Remove if a post with same slug exists (updating functionality)
        blogsIndex = blogsIndex.filter(p => p.slug !== slug);

        // Prepend the new post metadata
        blogsIndex.unshift({ title, summary, date, slug });

        // 3. Update the blogs.json
        const updatePayload = {
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: 'data/blogs.json',
            message: `Update blogs.json for ${title}`,
            content: utf8ToBase64(JSON.stringify(blogsIndex, null, 2))
        };
        if (indexSha) updatePayload.sha = indexSha;

        await octokit.rest.repos.createOrUpdateFileContents(updatePayload);

        showAlert('Post published successfully!', 'success');
        
        // Reset form
        inputTitle.value = '';
        inputSummary.value = '';
        easyMDE.value('');

    } catch (err) {
        console.error(err);
        if (err.status === 403) {
            showAlert('Permission Denied (403): Your GitHub Token needs "Contents" (write) or "repo" scope.');
        } else if (err.status === 401) {
            showAlert('Unauthorized (401): Invalid or expired GitHub Token.');
        } else {
            showAlert(`Error publishing: ${err.message}`);
        }
    } finally {
        btnPublish.disabled = false;
        btnPublish.innerHTML = '<i class="fas fa-paper-plane"></i> Publish to GitHub';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
