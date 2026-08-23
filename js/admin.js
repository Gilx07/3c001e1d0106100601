(()=>{
  'use strict';

  const OWNER='Gilx07';
  const REPO='3c001e1d0106100601';
  const BRANCH='main';
  const API='https://api.github.com';

  const loginCard=document.getElementById('login-card');
  const workspace=document.getElementById('workspace');
  const tokenInput=document.getElementById('token');
  const connectBtn=document.getElementById('connect');
  const loginStatus=document.getElementById('login-status');
  const refreshBtn=document.getElementById('refresh');
  const logoutBtn=document.getElementById('logout');
  const account=document.getElementById('account');
  const postList=document.getElementById('post-list');
  const emptyEditor=document.getElementById('empty-editor');
  const editor=document.getElementById('editor');
  const currentPath=document.getElementById('current-path');
  const titleInput=document.getElementById('post-title');
  const descriptionInput=document.getElementById('post-description');
  const dateInput=document.getElementById('post-date');
  const categoryInput=document.getElementById('post-category');
  const bodyInput=document.getElementById('post-body');
  const commitInput=document.getElementById('commit-message');
  const saveBtn=document.getElementById('save');
  const editorStatus=document.getElementById('editor-status');
  const previewBtn=document.getElementById('preview-btn');
  const previewDialog=document.getElementById('preview-dialog');
  const previewFrame=document.getElementById('preview-frame');
  const previewClose=document.getElementById('preview-close');

  let token=sessionStorage.getItem('dolenthis_github_token')||'';
  let selectedPath='';
  let selectedSha='';
  let originalHtml='';

  const setStatus=(el,message,type='')=>{
    el.textContent=message||'';
    el.classList.remove('error','success');
    if(type)el.classList.add(type);
  };

  const encodePath=path=>path.split('/').map(encodeURIComponent).join('/');

  async function api(path,options={}){
    if(!token)throw new Error('GitHub token belum tersedia.');
    const response=await fetch(`${API}${path}`,{
      ...options,
      headers:{
        Accept:'application/vnd.github+json',
        Authorization:`Bearer ${token}`,
        'X-GitHub-Api-Version':'2022-11-28',
        ...(options.headers||{})
      }
    });
    if(response.status===204)return null;
    const data=await response.json().catch(()=>null);
    if(!response.ok){
      const error=new Error(data?.message||`GitHub API error ${response.status}`);
      error.status=response.status;
      error.acceptedPermissions=response.headers.get('x-accepted-github-permissions')||'';
      error.requestId=response.headers.get('x-github-request-id')||'';
      throw error;
    }
    return data;
  }

  function decodeBase64(value){
    const clean=value.replace(/\s/g,'');
    const binary=atob(clean);
    const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeBase64(value){
    const bytes=new TextEncoder().encode(value);
    let binary='';
    const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk){
      binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
    }
    return btoa(binary);
  }

  function parsePost(html){
    const doc=new DOMParser().parseFromString(html,'text/html');
    const pageTitle=doc.querySelector('.article-title')?.textContent?.trim()||doc.querySelector('h1')?.textContent?.trim()||'';
    const description=doc.querySelector('meta[name="description"]')?.getAttribute('content')||'';
    const meta=[...doc.querySelectorAll('.article-meta span')];
    const date=meta[0]?.textContent?.trim()||'';
    const category=meta[1]?.textContent?.trim()||'';
    const article=doc.querySelector('.article-panel');
    return {doc,pageTitle,description,date,category,body:article?.innerHTML.trim()||''};
  }

  function serializePost(){
    const parsed=new DOMParser().parseFromString(originalHtml,'text/html');
    const title=titleInput.value.trim();
    const description=descriptionInput.value.trim();
    if(!title)throw new Error('Judul tidak boleh kosong.');

    const metaDescription=parsed.querySelector('meta[name="description"]');
    if(metaDescription)metaDescription.setAttribute('content',description);

    const titleEl=parsed.querySelector('title');
    if(titleEl)titleEl.textContent=`${title} — Dolenthis`;

    const heading=parsed.querySelector('.article-title')||parsed.querySelector('h1');
    if(heading)heading.textContent=title;

    let meta=parsed.querySelector('.article-meta');
    if(!meta){
      meta=parsed.createElement('div');
      meta.className='article-meta';
      const rule=parsed.querySelector('.page-rule');
      rule?.parentNode?.insertBefore(meta,rule);
    }
    meta.replaceChildren();
    const dateSpan=parsed.createElement('span');
    dateSpan.textContent=dateInput.value.trim();
    const categorySpan=parsed.createElement('span');
    categorySpan.textContent=categoryInput.value.trim();
    meta.append(dateSpan,categorySpan);

    const article=parsed.querySelector('.article-panel');
    if(!article)throw new Error('Struktur artikel tidak dikenali. Elemen .article-panel tidak ditemukan.');
    article.innerHTML=bodyInput.value.trim();

    return `<!DOCTYPE html>\n${parsed.documentElement.outerHTML}\n`;
  }

  async function syncBlogListing(){
    const indexFile=await api(`/repos/${OWNER}/${REPO}/contents/blog.html?ref=${encodeURIComponent(BRANCH)}`);
    const indexHtml=decodeBase64(indexFile.content||'');
    const doc=new DOMParser().parseFromString(indexHtml,'text/html');
    const card=[...doc.querySelectorAll('a.post-card')].find(item=>item.getAttribute('href')===selectedPath);
    if(!card)throw new Error(`Kartu untuk ${selectedPath} tidak ditemukan di blog.html.`);

    const title=card.querySelector('h2');
    const description=card.querySelector('.post-copy p');
    const date=card.querySelector('.post-date');
    if(title)title.textContent=titleInput.value.trim();
    if(description)description.textContent=descriptionInput.value.trim();
    if(date)date.textContent=dateInput.value.trim();

    const updated=`<!DOCTYPE html>\n${doc.documentElement.outerHTML}\n`;
    return api(`/repos/${OWNER}/${REPO}/contents/blog.html`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        message:`content: sync blog listing for ${selectedPath}`,
        content:encodeBase64(updated),
        sha:indexFile.sha,
        branch:BRANCH
      })
    });
  }

  async function connect(){
    const entered=tokenInput.value.trim();
    if(entered)token=entered;
    if(!token){setStatus(loginStatus,'Masukkan GitHub token terlebih dahulu.','error');return;}

    connectBtn.disabled=true;
    setStatus(loginStatus,'Memeriksa akses GitHub...');
    try{
      const user=await api('/user');
      const repo=await api(`/repos/${OWNER}/${REPO}`);
      sessionStorage.setItem('dolenthis_github_token',token);
      const push=repo.permissions?.push===true?'push access: yes':repo.permissions?.push===false?'push access: no':'push access: unknown';
      account.textContent=`Terhubung sebagai ${user.login} · ${push}`;
      loginCard.classList.add('hidden');
      workspace.classList.remove('hidden');
      setStatus(loginStatus,'');
      await loadPosts();
    }catch(error){
      token='';
      sessionStorage.removeItem('dolenthis_github_token');
      setStatus(loginStatus,`Gagal terhubung: ${error.message}`,'error');
    }finally{
      connectBtn.disabled=false;
    }
  }

  async function loadPosts(){
    refreshBtn.disabled=true;
    postList.replaceChildren();
    const loading=document.createElement('div');
    loading.className='account';
    loading.textContent='Memuat daftar post...';
    postList.appendChild(loading);
    try{
      const files=await api(`/repos/${OWNER}/${REPO}/contents?ref=${encodeURIComponent(BRANCH)}`);
      const posts=files.filter(item=>item.type==='file'&&/^blog-.+\.html$/i.test(item.name)).sort((a,b)=>a.name.localeCompare(b.name));
      postList.replaceChildren();
      if(!posts.length){
        const empty=document.createElement('div');
        empty.className='account';
        empty.textContent='Belum ada file blog-*.html.';
        postList.appendChild(empty);
        return;
      }
      for(const item of posts){
        const button=document.createElement('button');
        button.type='button';
        button.className='post-item';
        button.dataset.path=item.path;
        const label=document.createElement('strong');
        label.textContent=item.name.replace(/^blog-|\.html$/gi,'').replace(/-/g,' ');
        const path=document.createElement('span');
        path.textContent=item.path;
        button.append(label,path);
        button.addEventListener('click',()=>loadPost(item.path,button));
        postList.appendChild(button);
      }
    }catch(error){
      postList.replaceChildren();
      const failure=document.createElement('div');
      failure.className='account';
      failure.textContent=`Gagal memuat post: ${error.message}`;
      postList.appendChild(failure);
    }finally{
      refreshBtn.disabled=false;
    }
  }

  async function loadPost(path,button){
    setStatus(editorStatus,'');
    document.querySelectorAll('.post-item').forEach(item=>item.classList.toggle('active',item===button));
    button.disabled=true;
    try{
      const file=await api(`/repos/${OWNER}/${REPO}/contents/${encodePath(path)}?ref=${encodeURIComponent(BRANCH)}`);
      const html=decodeBase64(file.content||'');
      const parsed=parsePost(html);
      selectedPath=path;
      selectedSha=file.sha;
      originalHtml=html;
      currentPath.textContent=path;
      titleInput.value=parsed.pageTitle;
      descriptionInput.value=parsed.description;
      dateInput.value=parsed.date;
      categoryInput.value=parsed.category;
      bodyInput.value=parsed.body;
      commitInput.value=`content: update ${path}`;
      emptyEditor.classList.add('hidden');
      editor.classList.remove('hidden');
    }catch(error){
      setStatus(editorStatus,`Gagal membuka post: ${error.message}`,'error');
    }finally{
      button.disabled=false;
    }
  }

  async function savePost(){
    if(!selectedPath||!selectedSha){setStatus(editorStatus,'Pilih post terlebih dahulu.','error');return;}
    saveBtn.disabled=true;
    setStatus(editorStatus,'Memeriksa versi terbaru...');
    try{
      const latest=await api(`/repos/${OWNER}/${REPO}/contents/${encodePath(selectedPath)}?ref=${encodeURIComponent(BRANCH)}`);
      if(latest.sha!==selectedSha)throw new Error('File berubah sejak dibuka. Refresh dan buka kembali post sebelum menyimpan.');
      const html=serializePost();
      const message=commitInput.value.trim()||`content: update ${selectedPath}`;
      setStatus(editorStatus,'Menyimpan artikel...');
      const result=await api(`/repos/${OWNER}/${REPO}/contents/${encodePath(selectedPath)}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message,content:encodeBase64(html),sha:selectedSha,branch:BRANCH})
      });
      selectedSha=result.content.sha;
      originalHtml=html;
      setStatus(editorStatus,'Artikel tersimpan. Menyinkronkan daftar Blog...');
      const listingResult=await syncBlogListing();
      setStatus(editorStatus,`Tersimpan dan sinkron. Commit artikel ${result.commit.sha.slice(0,12)}, listing ${listingResult.commit.sha.slice(0,12)}.`,'success');
    }catch(error){
      let detail=`Gagal menyimpan: ${error.message}`;
      if(error.status===403){
        detail+=' · HTTP 403.';
        if(error.acceptedPermissions)detail+=` GitHub meminta: ${error.acceptedPermissions}.`;
        detail+=' Disconnect, masukkan ulang token terbaru, dan pastikan Fine-grained PAT memakai Resource owner Gilx07 serta Contents: Read and write.';
      }
      if(error.requestId)detail+=` Request ID: ${error.requestId}`;
      setStatus(editorStatus,detail,'error');
    }finally{
      saveBtn.disabled=false;
    }
  }

  function showPreview(){
    const title=titleInput.value.trim()||'Untitled';
    const body=bodyInput.value;
    const date=dateInput.value.trim();
    const category=categoryInput.value.trim();
    previewFrame.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><style>html{color-scheme:dark}body{margin:0;padding:36px;background:#080604;color:#e7d9c4;font:17px/1.72 Georgia,serif}main{max-width:760px;margin:auto}h1{color:#e2bd86;font-size:2.35rem;line-height:1.1;margin:0 0 10px}.meta{color:#8f7a60;font-size:.84rem;margin-bottom:28px}article{border-top:1px solid #4a3522;padding-top:24px}h2{color:#d4b182;margin-top:1.8em}p,li{color:#b9a58a}a{color:#d2a56d}.note,.article-note{padding:16px;border:1px solid #5a4028;border-radius:10px;background:#110c08}</style></head><body><main><h1>${escapeHtml(title)}</h1><div class="meta">${escapeHtml(date)}${date&&category?' · ':''}${escapeHtml(category)}</div><article>${body}</article></main></body></html>`;
    previewDialog.showModal();
  }

  function escapeHtml(value){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}

  function logout(){
    token='';selectedPath='';selectedSha='';originalHtml='';
    sessionStorage.removeItem('dolenthis_github_token');
    tokenInput.value='';workspace.classList.add('hidden');loginCard.classList.remove('hidden');editor.classList.add('hidden');emptyEditor.classList.remove('hidden');
    setStatus(loginStatus,'Sesi GitHub telah diputus. Masukkan token kembali untuk membuat sesi baru.');
  }

  connectBtn.addEventListener('click',connect);
  tokenInput.addEventListener('keydown',event=>{if(event.key==='Enter')connect();});
  refreshBtn.addEventListener('click',loadPosts);
  logoutBtn.addEventListener('click',logout);
  saveBtn.addEventListener('click',savePost);
  previewBtn.addEventListener('click',showPreview);
  previewClose.addEventListener('click',()=>previewDialog.close());
  previewDialog.addEventListener('click',event=>{if(event.target===previewDialog)previewDialog.close();});

  if(token){tokenInput.value=token;connect();}
})();
