(() => {
  const root=document.getElementById('opscards-quick-access');
  const $=s=>root.querySelector(s);
  const records=JSON.parse(document.getElementById('nb-records').textContent);
  const books=[
    {id:'workstations',name:'Комп’ютери користувачів'},
    {id:'servers',name:'Сервери та служби'},
    {id:'network',name:'Мережа та доступ'},
    {id:'files',name:'Файли та перенесення'},
    {id:'deploy',name:'Розгортання та Git'}
  ];
  const firstId=records.find(n=>n.id==='windows-gpo-msi--1')?.id||records[0].id;
  const defaults=()=>({id:firstId,book:'workstations',overrides:{},favorites:[],recent:[firstId]});
  let state=defaults(), view='read',activeQuery='',limit=8,dirty=false,editingId=null,returnFocus=null,pendingLeave=null;
  let searchOrigin='read',returnToResults=null;
  const recentLimit=6;
  const storageKey='opscards-notebook-v1';
  const confirmed={};
  let saving=false;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').normalize('NFKC').toLocaleLowerCase('uk').replace(/[’‘ʼ`]/g,"'");
  const normalizedPhrase=text=>norm(text).trim().replace(/\s+/g,' ');
  const symptomFiller=new Set('а або в від для до за з із і й на після по при у через чи чому що щоб як'.split(' '));
  function symptomWords(text){
    const words=norm(text).match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu)||[];
    return [...new Set(words.filter(word=>!symptomFiller.has(word)))];
  }
  const noteSymptoms=note=>note.symptoms||[];
  const all=()=>{const originals=records.map(n=>({...n,...state.overrides[n.id]}));return originals.concat(Object.values(state.overrides).filter(n=>!records.some(r=>r.id===n.id)));};
  const current=()=>all().find(n=>n.id===state.id)||all()[0];
  const bookName=id=>books.find(b=>b.id===id)?.name||books[0].name;
  const platformNames=note=>(note.platforms||[]).map(platform=>({linux:'Linux',windows:'Windows',macos:'macOS'}[platform]||platform)).join(' · ');
  const titleOrder=new Intl.Collator('uk');
  const status=text=>{$('#nb-status').textContent=text;};
  const login=$('#nb-login');
  const editorSession=fetch('/api/editor?action=session',{cache:'no-store'})
    .then(response=>response.ok,()=>false);
  editorSession.then(allowed=>{
    login.hidden=allowed;
    $('#nb-new').hidden=!allowed;
  });
  async function requireEditor(action){
    if(await editorSession)action();
    else{
      login.hidden=false;
      status('Для редагування увійдіть через GitHub.');
      login.focus();
    }
  }
  function remember(){
    try{
      localStorage.setItem(storageKey,JSON.stringify({id:state.id,favorites:state.favorites,recent:state.recent,confirmed}));
    }catch{
      status('Браузер не зберіг налаштування цієї вкладки.');
    }
  }
  function restore(){
    try{
      const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
      if(!saved)return;
      for(const [id,entry] of Object.entries(saved.confirmed||{})){
        const published=records.find(note=>note.id===id)?.revision||'';
        const note=entry?.note;
        if(!note?.revision||note.id!==id||published===note.revision||!entry.replaces?.includes(published))continue;
        confirmed[id]=entry;
        state.overrides[id]=note;
      }
      const knownIds=new Set(all().map(note=>note.id));
      const validIds=ids=>Array.isArray(ids)?[...new Set(ids.filter(id=>knownIds.has(id)))]:[];
      if(knownIds.has(saved.id))state.id=saved.id;
      state.favorites=validIds(saved.favorites);
      const recent=validIds(saved.recent);
      if(recent.length)state.recent=recent.slice(0,recentLimit);
    }catch{}
  }
  async function writeNote(note){
    const revision=note.revision||'';
    const response=await fetch('/api/editor?action=notebook-note&slug='+encodeURIComponent(note.id),{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({note,revision}),
    });
    const result=await response.json();
    if(!response.ok){
      if(response.status===401)login.hidden=false;
      throw new Error(result.error||'Не вдалося зберегти нотатку.');
    }
    if(!result.note?.revision)throw new Error('GitHub не підтвердив збереження нотатки.');
    const prior=confirmed[note.id]?.replaces||[];
    confirmed[note.id]={note:result.note,replaces:[...new Set([...prior,revision])]};
    state.overrides[note.id]=result.note;
    remember();
  }
  function inline(text){
    const slots=[];
    let result=esc(text).replace(/`([^`]+)`/g,(_,code)=>{slots.push(`<code>${code}</code>`);return `\u0001${slots.length-1}\u0001`;});
    result=result.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>');
    return result.replace(/\u0001(\d+)\u0001/g,(_,i)=>slots[Number(i)]);
  }
  function copyButton(command,title=''){
    return `<button class="nb-copy" type="button" data-copy="${esc(command)}"><span>Копіювати</span>${title?`<span class="nb-sr"> команду з нотатки «${esc(title)}»</span>`:''}</button>`;
  }
  function codeBlock(command,lang=''){
    return `<div class="nb-command-block" data-copy-source><div class="nb-command-top"><span>${esc(lang||'Команда / клавіші')}</span>${copyButton(command)}</div><pre><code>${esc(command)}</code></pre></div>`;
  }
  function markdown(text){
    const lines=text.split('\n');let html='',paragraph=[],quote=[],list=[],code=null,lang='';
    const flush=()=>{if(paragraph.length){html+=`<p>${inline(paragraph.join(' '))}</p>`;paragraph=[];}if(quote.length){html+=`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`;quote=[];}if(list.length){html+=`<ul>${list.map(s=>`<li>${inline(s)}</li>`).join('')}</ul>`;list=[];}};
    for(const line of lines){
      if(line.startsWith('```')){if(code!==null){html+=codeBlock(code.join('\n'),lang);code=null;}else{flush();lang=line.slice(3).trim();code=[];}continue;}
      if(code!==null){code.push(line);continue;}
      if(!line.trim()){flush();continue;}
      if(/^#{1,6} /.test(line)){flush();html+=`<h3>${inline(line.replace(/^#{1,6} /,''))}</h3>`;continue;}
      if(/^> ?/.test(line)){if(paragraph.length||list.length)flush();quote.push(line.replace(/^> ?/,''));continue;}
      if(/^[-*] /.test(line)){if(paragraph.length||quote.length)flush();list.push(line.slice(2));continue;}
      if(/^---+$/.test(line.trim())){flush();continue;}
      if(quote.length||list.length)flush();paragraph.push(line);
    }
    flush();if(code!==null)html+=codeBlock(code.join('\n'),lang);return html;
  }
  function markText(container,query){
    const tokens=norm(query).trim().split(/\s+/).filter(Boolean).sort((a,b)=>b.length-a.length);
    if(!tokens.length)return;
    const expression=new RegExp(tokens.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replaceAll("'","['’‘ʼ`]")).join('|'),'giu');
    const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('button:not([data-note]),mark')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){const text=node.textContent;expression.lastIndex=0;let match,start=0;const fragment=document.createDocumentFragment();while((match=expression.exec(text))){fragment.append(text.slice(start,match.index));const mark=document.createElement('mark');mark.textContent=match[0];fragment.append(mark);start=match.index+match[0].length;}if(start){fragment.append(text.slice(start));node.replaceWith(fragment);}}
  }
  function switchView(next){
    view=next;
    root.dataset.view=next==='catalog'?'search':next;
    if(root.dataset.view==='search'||next==='quick')returnToResults=null;
    for(const name of ['read','quick','search','edit']){
      const id=name==='edit'?'editor':name;
      $(`#nb-${id}-view`).hidden=name!==root.dataset.view;
    }
    if(next==='quick')$('#nb-quick').setAttribute('aria-current','page');
    else $('#nb-quick').removeAttribute('aria-current');
    if(next==='catalog'||(next==='search'&&searchOrigin==='catalog'))$('#nb-catalog').setAttribute('aria-current','page');
    else $('#nb-catalog').removeAttribute('aria-current');
    for(const button of $('#nb-books').children){
      if(next==='read'&&button.dataset.book===state.book)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    }
  }
  function renderNav(){
    $('#nb-books').innerHTML=books.map(book=>`<button type="button" class="nb-book" data-book="${book.id}" ${state.book===book.id?'aria-current="page"':''}><span>${book.name}</span></button>`).join('');
    $('#nb-source-count').textContent=`${records.length} опублікованих нотаток`;
  }
  function renderPage(query=''){
    const note=current();state.book=note.book;renderNav();
    $('#nb-back-results').hidden=!returnToResults;
    $('#nb-back-results').textContent=returnToResults?.query?'← До результатів':'← До каталогу';
    $('#nb-book-name').textContent=bookName(note.book);
    $('#nb-tool-name').textContent=note.originTitle||'Власна нотатка';
    const pages=all().filter(n=>n.book===note.book), groups=new Map();
    for(const p of pages){const label=p.originTitle||'Власні нотатки';if(!groups.has(label))groups.set(label,[]);groups.get(label).push(p);}
    const select=$('#nb-page-select');select.replaceChildren();
    for(const [label,notes] of groups){const group=document.createElement('optgroup');group.label=label;for(const p of notes)group.append(new Option(p.title,p.id));select.append(group);}
    select.value=note.id;
    $('#nb-platform').textContent=platformNames(note)||'Власна нотатка';
    $('#nb-origin-label').textContent=state.overrides[note.id]?'Збережено в GitHub':'З вашого каталогу';
    $('#nb-title').textContent=note.title;
    $('#nb-favorite').setAttribute('aria-pressed',String(state.favorites.includes(note.id)));
    $('#nb-command-zone').innerHTML=note.command?codeBlock(note.command,note.lang):'';
    $('#nb-description').innerHTML=markdown(note.description||'');
    $('#nb-sources').innerHTML=(note.sources||[]).length?`<span>Джерела вихідного запису</span>${note.sources.filter(s=>/^https?:\/\//.test(s.url)).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('')}`:'';
    $('#nb-sources').hidden=!(note.sources||[]).length;
    const at=pages.findIndex(p=>p.id===note.id);
    $('#nb-prev').textContent=at>0?`← ${pages[at-1].title}`:'';$('#nb-prev').disabled=at===0;$('#nb-prev').dataset.id=pages[at-1]?.id||'';
    $('#nb-next').textContent=at<pages.length-1?`${pages[at+1].title} →`:'';$('#nb-next').disabled=at===pages.length-1;$('#nb-next').dataset.id=pages[at+1]?.id||'';
    switchView('read');if(query)markText($('#nb-document'),query);
  }
  function openNote(id,{query='',message='',fromResults=null}={}){
    if(!all().some(n=>n.id===id))return;
    returnToResults=fromResults;
    state.id=id;
    state.recent=[id,...state.recent.filter(other=>other!==id)].slice(0,recentLimit);
    $('#nb-query').value='';
    activeQuery='';
    renderPage(query);
    status(message||(query?`Знайдено фрагмент у нотатці «${current().title}».`:'Нотатку відкрито.'));
    remember();
  }
  function renderQuick(){
    const notes=new Map(all().map(note=>[note.id,note]));
    const renderList=ids=>ids.map(id=>notes.get(id)).filter(Boolean).map(note=>{
      const command=note.command||'';
      const [firstLine]=command.split('\n',1);
      const preview=firstLine.length<command.length?`${firstLine} …`:firstLine;
      return `<li class="nb-quick-row" data-copy-source><button class="nb-quick-item" type="button" data-quick-note="${esc(note.id)}"><span>${esc(note.title)}</span><span class="nb-quick-context">${bookName(note.book)}</span></button>${command.trim()?copyButton(command,note.title)+`<pre class="nb-quick-command"><code>${esc(preview)}</code></pre>`:''}</li>`;
    }).join('');
    $('#nb-favorites-list').innerHTML=renderList(state.favorites);
    $('#nb-favorites-empty').hidden=state.favorites.length>0;
    $('#nb-recent-list').innerHTML=renderList(state.recent);
    switchView('quick');
  }
  $('#nb-quick').addEventListener('click',()=>safeLeave(()=>{
    $('#nb-query').value='';
    activeQuery='';
    renderQuick();
  }));
  $('#nb-quick-view').addEventListener('click',event=>{
    const button=event.target.closest('[data-quick-note]');
    if(!button)return;
    openNote(button.dataset.quickNote);
    $('#nb-favorite').focus();
  });
  function toggleFavorite(id,button){
    const add=!state.favorites.includes(id);
    state.favorites=add?[id,...state.favorites]:state.favorites.filter(other=>other!==id);
    button.setAttribute('aria-pressed',String(add));
    status(add?'Додано до обраного.':'Вилучено з обраного.');
    remember();
  }
  $('#nb-favorite').addEventListener('click',event=>toggleFavorite(current().id,event.currentTarget));
  function safeLeave(action){
    if(view==='edit'&&saving)return;
    if(view!=='edit'||!dirty){action();return;}
    pendingLeave=action;returnFocus=document.activeElement;$('#nb-confirm').hidden=false;$('#nb-stay').focus();
  }
  function closeConfirm(){ $('#nb-confirm').hidden=true;pendingLeave=null;returnFocus?.focus(); }
  $('#nb-stay').addEventListener('click',closeConfirm);
  $('#nb-leave').addEventListener('click',()=>{const action=pendingLeave;dirty=false;closeConfirm();action?.();});
  $('#nb-confirm').addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeConfirm();}
    if(event.key==='Tab'){const first=$('#nb-stay'),last=$('#nb-leave');if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  });
  $('#nb-books').addEventListener('click',event=>{const button=event.target.closest('[data-book]');if(!button)return;safeLeave(()=>{const next=all().find(n=>n.book===button.dataset.book);if(next)openNote(next.id);});});
  $('#nb-page-select').addEventListener('change',event=>openNote(event.target.value));
  for(const id of ['#nb-prev','#nb-next'])$(id).addEventListener('click',event=>openNote(event.currentTarget.dataset.id));
  function rankNote(note,commandQuery,terms,words){
    const title=norm(note.title),command=norm(note.command);
    const lines=command.split('\n').map(line=>line.trim().replace(/\s+/g,' '));
    const commandRank=lines.includes(commandQuery)?2:lines.some(line=>line.startsWith(commandQuery+' '))?1:0;
    const text=norm([note.title,note.command,note.description,note.originTitle,...(note.tags||[]),bookName(note.book),platformNames(note)].join(' '));
    const lexicalScore=terms.every(term=>text.includes(term))?
      terms.reduce((sum,term)=>sum+(title.includes(term)?6:0)+(command.includes(term)?4:0),1):0;
    let symptom='',symptomScore=0;
    if(!commandRank){
      for(const phrase of noteSymptoms(note)){
        const exactPhrase=normalizedPhrase(phrase)===commandQuery;
        const alias=symptomWords(phrase);
        const shared=words.filter(word=>alias.includes(word)).length;
        if(!exactPhrase&&(shared<2||shared/words.length<0.7||shared/alias.length<0.5))continue;
        const score=exactPhrase?32+3*shared:12+3*shared+6*shared/words.length;
        if(score>symptomScore){
          symptom=phrase;
          symptomScore=score;
        }
      }
    }
    return {note,commandRank,score:lexicalScore+symptomScore,symptom};
  }
  function search(){
    const query=$('#nb-query').value.trim();
    if(!query){
      activeQuery='';
      if(view==='catalog'||(view==='search'&&searchOrigin==='catalog'))renderResults('');
      else if(view==='search'&&searchOrigin==='quick')renderQuick();
      else if(view==='search')renderPage();
      return;
    }
    if(view!=='search'){
      searchOrigin=view;
      if(view!=='catalog')$('#nb-platform-filter input').checked=true;
    }
    renderResults(query);
  }
  function scopedNotes(){
    const platform=$('#nb-platform-filter input:checked').value;
    const onlyFavorites=$('#nb-only-favorites').checked;
    return all().filter(note=>
      (!platform||note.platforms?.includes(platform))&&(!onlyFavorites||state.favorites.includes(note.id))
    );
  }
  function renderResults(query){
    activeQuery=query;
    const platform=$('#nb-platform-filter input:checked').value;
    const onlyFavorites=$('#nb-only-favorites').checked;
    const terms=norm(query).split(/\s+/).filter(Boolean);
    const words=symptomWords(query);
    const notes=scopedNotes();
    const matches=query?
      notes.map(note=>rankNote(note,terms.join(' '),terms,words))
        .filter(result=>result.commandRank||result.score)
        .sort((a,b)=>b.commandRank-a.commandRank||b.score-a.score):
      notes.sort((a,b)=>titleOrder.compare(a.title,b.title)).map(note=>({note}));
    $('#nb-results-heading').textContent=query?'Результати пошуку':'Каталог команд';
    $('#nb-clear-search').textContent=query?'Очистити пошук':'До нотатки';
    const catalogCount=onlyFavorites?'Обраних нотаток':'Нотаток у каталозі';
    $('#nb-result-count').textContent=query?`Знайдено: ${matches.length} · «${query}»`:`${catalogCount}: ${matches.length}`;
    $('#nb-search-keys').hidden=!matches.length;
    let emptyMessage=platform?'Збігів для цієї платформи немає. Виберіть «Усі» або змініть запит.':'Спробуйте назву інструмента або коротшу фразу.';
    if(onlyFavorites){
      emptyMessage=state.favorites.length?'Серед обраного збігів немає. Змініть запит або фільтри.':'В обраному ще немає нотаток. Вимкніть «Лише обране», щоб додати потрібні.';
    }
    $('#nb-results').innerHTML=matches.length?matches.slice(0,limit).map(({note,symptom})=>{
      const risk=note.description.match(/^\s*>\s*\*\*Ризик:\s*((?:змінює|незворотно)(?:\s[^*\r\n]*?)?)\.?\*\*/i);
      const impact=risk?risk[1].charAt(0).toLocaleUpperCase('uk')+risk[1].slice(1):'';
      const description=risk?note.description.slice(risk[0].length):note.description;
      const plain=description.replace(/[`#>*]/g,'').replace(/\s+/g,' ').trim();
      const normalized=norm(plain);
      const positions=terms.map(term=>normalized.indexOf(term)).filter(index=>index>=0);
      const matchAt=positions.length?Math.min(...positions):0;
      const offset=Math.max(0,matchAt-55);
      const nextSpace=plain.indexOf(' ',offset);
      const start=offset&&nextSpace>=offset&&nextSpace<matchAt?nextSpace+1:offset;
      const end=Math.min(plain.length,start+210);
      const lastSpace=end<plain.length?plain.lastIndexOf(' ',end):end;
      const stop=lastSpace>start?lastSpace:end;
      const excerpt=(start?'…':'')+plain.slice(start,stop)+(plain.length>stop?'…':'');
      const command=note.command||'';
      const hasCommand=Boolean(command.trim());
      const commandPreview=command.length>240?`${command.slice(0,240)}…`:command;
      const platforms=platformNames(note);
      const actions=`<div class="nb-result-actions">
        ${hasCommand?copyButton(command,note.title):''}
        <button class="nb-secondary nb-favorite" type="button" data-favorite="${esc(note.id)}" aria-pressed="${state.favorites.includes(note.id)}">
          В обране<span class="nb-sr"> «${esc(note.title)}»</span>
        </button>
      </div>`;
      return `<div class="nb-result-row">
        <button class="nb-result" type="button" data-note="${esc(note.id)}">
          <span class="nb-result-title"><span>${esc(note.title)}</span></span>
          <span class="nb-result-context">
            ${platforms?`<span class="nb-result-platforms">${esc(platforms)}</span>`:''}
            <span>${bookName(note.book)} / ${esc(note.originTitle||'Власна нотатка')}</span>
          </span>
        </button>
        ${symptom?`<p class="nb-result-symptom">Схожий симптом — ${esc(symptom)}</p>`:''}
        ${impact?`<span class="nb-result-impact">${esc(impact)}</span>`:''}
        ${hasCommand?`<div class="nb-result-command" data-copy-source><pre><code>${esc(commandPreview)}</code></pre>${actions}</div>`:actions}
        ${excerpt?`<p class="nb-result-excerpt">${esc(excerpt)}</p>`:''}
      </div>`;
    }).join(''):`<p>${emptyMessage}</p>`;
    $('#nb-symptom-action').hidden=!query||matches.length>0||!notes.length;
    setSymptomPickerOpen(false);
    const remaining=matches.length-limit;
    $('#nb-more-results').hidden=remaining<=0;
    $('#nb-more-results').textContent=`Показати ще (${Math.min(16,Math.max(0,remaining))})`;
    markText($('#nb-results'),query);
    switchView(query?'search':'catalog');
  }
  const symptomPicker=$('#nb-symptom-picker');
  const symptomToggle=$('#nb-start-symptom');
  const symptomFind=$('#nb-symptom-find');
  const symptomNote=$('#nb-symptom-note');
  const symptomSave=$('#nb-link-symptom');
  const symptomSelection=$('#nb-symptom-selection');
  const symptomError=$('#nb-symptom-error');
  function setSymptomPickerOpen(open){
    symptomPicker.hidden=!open;
    symptomToggle.setAttribute('aria-expanded',String(open));
    symptomError.hidden=true;
  }
  function updateSymptomChoice(){
    symptomSave.disabled=!symptomNote.value;
    symptomSelection.hidden=!symptomNote.value;
    symptomSelection.textContent=symptomNote.value?symptomNote.selectedOptions[0].textContent:'';
    symptomError.hidden=true;
  }
  function fillSymptomNotes(){
    const terms=normalizedPhrase(symptomFind.value).split(' ').filter(Boolean);
    const candidates=scopedNotes().filter(note=>{
      const text=norm([note.title,note.command,note.originTitle,bookName(note.book)].join(' '));
      return terms.every(term=>text.includes(term));
    }).sort((a,b)=>titleOrder.compare(a.title,b.title));
    symptomNote.replaceChildren(new Option(candidates.length?'Оберіть нотатку':'Нотаток не знайдено',''));
    for(const book of books){
      const group=document.createElement('optgroup');
      group.label=book.name;
      for(const note of candidates.filter(note=>note.book===book.id)){
        group.append(new Option(note.originTitle?`${note.title} · ${note.originTitle}`:note.title,note.id));
      }
      if(group.childElementCount)symptomNote.append(group);
    }
    updateSymptomChoice();
  }
  function closeSymptomPicker(){
    setSymptomPickerOpen(false);
    symptomToggle.focus();
  }
  symptomToggle.addEventListener('click',()=>{
    if(!symptomPicker.hidden){closeSymptomPicker();return;}
    const query=activeQuery;
    requireEditor(()=>{
      if(view!=='search'||activeQuery!==query||$('#nb-symptom-action').hidden)return;
      $('#nb-symptom-value').textContent=query;
      symptomFind.value='';
      fillSymptomNotes();
      setSymptomPickerOpen(true);
      symptomFind.focus();
    });
  });
  symptomFind.addEventListener('input',fillSymptomNotes);
  symptomNote.addEventListener('change',updateSymptomChoice);
  $('#nb-cancel-symptom').addEventListener('click',closeSymptomPicker);
  symptomPicker.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeSymptomPicker();}
  });
  async function saveSearchSymptom(event){
    event.preventDefault();
    if(saving||symptomPicker.hidden||!activeQuery)return;
    const note=scopedNotes().find(note=>note.id===symptomNote.value);
    if(!note)return;
    const query=activeQuery;
    const existing=noteSymptoms(note);
    const alreadySaved=existing.some(phrase=>normalizedPhrase(phrase)===normalizedPhrase(query));
    if(!alreadySaved){
      const symptoms=[...existing,query];
      const max=$('#nb-edit-symptoms').maxLength;
      if(symptoms.join('\n').length>max){
        symptomError.textContent=`У полі «Симптоми» цієї нотатки вміщується до ${max} символів. Скоротіть запит або виберіть іншу нотатку.`;
        symptomError.hidden=false;
        return;
      }
      saving=true;
      symptomSave.disabled=true;
      try{
        await writeNote({...note,symptoms});
        status(`Симптом збережено в GitHub · «${note.title}».`);
      }catch(error){
        symptomError.textContent=error.message;
        symptomError.hidden=false;
        status(error.message);
        return;
      }finally{
        saving=false;
        symptomSave.disabled=!symptomNote.value;
      }
    }
    if(view!=='search'||activeQuery!==query||symptomPicker.hidden)return;
    renderResults(query);
    const result=$(`#nb-results [data-note="${CSS.escape(note.id)}"]`);
    (result||$('#nb-query')).focus();
  }
  symptomPicker.addEventListener('submit',saveSearchSymptom);
  symptomSave.addEventListener('click',saveSearchSymptom);
  $('#nb-catalog').addEventListener('click',()=>safeLeave(()=>{
    $('#nb-query').value='';
    $('#nb-platform-filter input').checked=true;
    limit=8;
    renderResults('');
  }));
  $('#nb-search-filters').addEventListener('change',()=>{
    limit=8;
    renderResults(activeQuery);
  });
  $('#nb-query').addEventListener('input',()=>{limit=8;if(view==='edit')safeLeave(search);else search();});
  $('#nb-query').addEventListener('keydown',event=>{
    if(event.key!=='ArrowDown'||event.isComposing||root.dataset.view!=='search')return;
    const first=$('#nb-results [data-note]');
    if(!first)return;
    event.preventDefault();
    first.focus();
  });
  $('#nb-results').addEventListener('click',event=>{
    const favorite=event.target.closest('[data-favorite]');
    if(favorite){
      toggleFavorite(favorite.dataset.favorite,favorite);
      if($('#nb-only-favorites').checked){
        const row=favorite.closest('.nb-result-row');
        const neighbor=row.nextElementSibling||row.previousElementSibling;
        const nextId=neighbor?.querySelector('[data-favorite]').dataset.favorite;
        renderResults(activeQuery);
        const next=nextId?$(`#nb-results [data-favorite="${CSS.escape(nextId)}"]`):null;
        (next||$('#nb-only-favorites')).focus();
      }
      return;
    }
    const result=event.target.closest('[data-note]');
    if(!result)return;
    const fromResults={query:activeQuery,platform:$('#nb-platform-filter input:checked').value,onlyFavorites:$('#nb-only-favorites').checked,origin:searchOrigin,limit};
    openNote(result.dataset.note,{query:activeQuery,fromResults});
    $('#nb-favorite').focus();
  });
  $('#nb-back-results').addEventListener('click',()=>{
    if(!returnToResults)return;
    const previous=returnToResults;
    $('#nb-query').value=previous.query;
    for(const radio of $('#nb-platform-filter').elements)radio.checked=radio.value===previous.platform;
    $('#nb-only-favorites').checked=previous.onlyFavorites;
    searchOrigin=previous.origin;
    limit=previous.limit;
    renderResults(previous.query);
    const result=$(`#nb-results [data-note="${CSS.escape(state.id)}"]`);
    (result||$('#nb-query')).focus();
  });
  $('#nb-results').addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      event.preventDefault();
      $('#nb-query').focus();
      return;
    }
    if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
    const row=event.target.closest('.nb-result-row');
    const adjacent=event.key==='ArrowDown'?row?.nextElementSibling:row?.previousElementSibling;
    const target=adjacent?.querySelector('[data-note]')||(event.key==='ArrowUp'?$('#nb-query'):null);
    if(!target)return;
    event.preventDefault();
    target.focus();
  });
  $('#nb-clear-search').addEventListener('click',()=>{
    if(view==='catalog'){renderPage();$('#nb-favorite').focus();return;}
    $('#nb-query').value='';
    limit=8;
    search();
    $('#nb-query').focus();
  });
  $('#nb-more-results').addEventListener('click',()=>{limit+=16;search();});
  const form=$('#nb-editor');
  for(const book of books)$('#nb-edit-book').add(new Option(book.name,book.id));
  function edit(isNew=false){
    editingId=isNew?null:current().id;const note=isNew?{title:'',book:state.book,command:'',description:'',sources:[]}:current();
    for(const field of ['title','book','command','description'])form.elements.namedItem(field).value=note[field]||'';
    for(const checkbox of form.querySelectorAll('[name=platform]'))checkbox.checked=Boolean(note.platforms?.includes(checkbox.value));
    form.elements.namedItem('symptoms').value=noteSymptoms(note).join('\n');
    form.elements.namedItem('source').value=note.sources?.[0]?.url||'';
    $('#nb-editor-context').textContent=bookName(note.book);$('#nb-editor-heading').textContent=isNew?'Нова нотатка':'Редагувати нотатку';
    $('#nb-form-error').textContent='';dirty=false;switchView('edit');form.elements.namedItem('title').focus();
  }
  $('#nb-edit').addEventListener('click',()=>requireEditor(()=>edit()));
  $('#nb-new').addEventListener('click',()=>requireEditor(()=>safeLeave(()=>{$('#nb-query').value='';edit(true);})));
  $('#nb-cancel').addEventListener('click',()=>safeLeave(()=>{dirty=false;renderPage();}));
  form.addEventListener('input',()=>{dirty=true;status('Є незбережені зміни.');});
  async function saveNote(event){
    event.preventDefault();if(saving||!form.reportValidity())return;
    const fields=new FormData(form);
    const values=Object.fromEntries(fields);
    if(!values.title.trim()||(!values.description.trim()&&!values.command.trim())){$('#nb-form-error').textContent='Додайте назву та команду або пояснення.';return;}
    const original=editingId?all().find(n=>n.id===editingId):{};
    const id=editingId||`local-${crypto.randomUUID()}`;
    const sources=(original.sources||[]).slice();const source=values.source.trim();
    if(source){if(!/^https?:\/\//.test(source)){$('#nb-form-error').textContent='Джерело має починатися з https:// або http://.';return;}sources[0]={label:sources[0]?.label||'Джерело нотатки',url:source};}else sources.shift();
    const symptoms=[],seenSymptoms=new Set();
    for(const line of values.symptoms.split('\n')){
      const key=normalizedPhrase(line);
      if(!key||seenSymptoms.has(key))continue;
      seenSymptoms.add(key);
      symptoms.push(line.trim());
    }
    const updated={...original,id,book:values.book,title:values.title.trim(),command:values.command.trim(),description:values.description.trim(),symptoms,sources,platforms:fields.getAll('platform'),tags:original.tags||[],originId:original.originId||'',originTitle:original.originTitle||'Власна нотатка',lang:original.lang||''};
    saving=true;
    form.inert=true;
    $('#nb-form-error').textContent='';
    try{
      await writeNote(updated);
      dirty=false;
      openNote(id,{message:'Нотатку збережено в GitHub. Сайт оновиться після збірки.',fromResults:editingId?returnToResults:null});
    }catch(error){
      $('#nb-form-error').textContent=error.message;
    }finally{
      saving=false;
      form.inert=false;
    }
  }
  form.addEventListener('submit',saveNote);
  $('#nb-save').addEventListener('click',saveNote);
  root.addEventListener('click',async event=>{
    const button=event.target.closest('[data-copy]');if(!button)return;
    const command=button.dataset.copy;
    const label=button.querySelector('span');
    let copied=false;
    try{
      await navigator.clipboard.writeText(command);
      copied=true;
    }catch{
      // The preview iframe can block the Clipboard API even during a click.
      if(!button.isConnected)return;
      const field=document.createElement('textarea');
      field.className='nb-sr';
      field.readOnly=true;
      field.value=command;
      root.append(field);
      field.select();
      try{copied=document.execCommand('copy');}catch{}
      field.remove();
      button.focus({preventScroll:true});
    }
    if(copied){
      label.textContent='Скопійовано';
      status('Команду скопійовано.');
      return;
    }
    const code=button.closest('[data-copy-source]').querySelector('code');
    if(code.textContent!==command)code.textContent=command;
    code.closest('.nb-quick-command')?.classList.add('nb-copy-expanded');
    const range=document.createRange();
    range.selectNodeContents(code);
    const selection=window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    label.textContent='Текст виділено';
    status('Натисніть Ctrl+C або ⌘C для копіювання.');
  });
  root.addEventListener('keydown',event=>{if(event.key==='/'&&!event.target.closest('input,textarea,select')){event.preventDefault();$('#nb-query').focus();}if(event.key==='Escape'&&event.target===$('#nb-query')){$('#nb-query').value='';search();}});
  restore();
  renderPage();
})();
