<script>
 import {onMount} from 'svelte';
 import {readLocal,writeLocal} from '@yoyo/storage';
 import Button from '@yoyo/ui/button';
 import {SUBJECTS,validateRecord,validateBackup} from './records.js';
 import {downloadJson} from './downloads.js';
 let {subject} = $props();
 let records=$state([]), canStore=$state(true), warning=$state(''), feedback=$state(''), error=$state(false), pending=$state(null), importStatus=$state(''), summary=$state('');
 let sequence=0;
 const key=() => `yoyo.learning.records.v1.${subject}`;
 onMount(() => {
  const result = readLocal(key(), [], value => Array.isArray(value) && value.length <= 500);
  if(result.available) {
   records = result.value.map(item => validateRecord(item).record).filter(Boolean);
   if(records.length !== result.value.length) warning='部分本机记录格式异常，已跳过。新记录仍可保存，请及时导出有效记录。';
  } else {
   canStore=false;
   warning='当前浏览器无法读取或保存记录。本次仍可临时记录，请在离开页面前导出；刷新后可能丢失。';
  }
  return ()=>{sequence++;};
 });
 function save(){
  if(!canStore)return;
  if(!writeLocal(key(),records)){
   canStore=false;
   warning='浏览器存储不可用或空间不足。本次记录仅临时保留，请立即导出备份，刷新后可能丢失。';
  }
 }
 function submit(event){event.preventDefault();const form=event.currentTarget;const result=validateRecord(Object.fromEntries(new FormData(form)));error=!!result.error;if(result.error){feedback=result.error;return;}if(records.length>=500){error=true;feedback='本机记录已达 500 条，请先导出备份。';return;}records.push(result.record);save();form.reset();feedback=canStore?'已保存到当前浏览器。给愿意复盘的自己一个赞！':'已临时记录，请导出备份后再离开。';}
 function exportRecords(){downloadJson({format:'yoyo-learning-records',version:1,subject,exportedAt:new Date().toISOString(),records},`悠悠-${SUBJECTS[subject].name}-考试记录.json`);}
 async function importFile(event){const seq=++sequence;pending=null;importStatus='';const input=event.currentTarget,file=input.files[0];input.value='';if(!file)return;if(file.size>1024*1024){importStatus='备份文件不能超过 1 MB。';return;}try{const data=JSON.parse(await file.text());if(seq!==sequence)return;const result=validateBackup(data,subject,records);if(result.error){importStatus=result.error;return;}if(!result.additions.length){importStatus=`没有新记录可导入，已跳过 ${result.duplicates} 条重复记录。`;return;}pending=data;summary=`将新增 ${result.additions.length} 条记录，跳过 ${result.duplicates} 条重复记录。现有记录与公开报告不会被替换。确认后仅保存在当前浏览器。`;}catch{if(seq===sequence)importStatus='无法读取备份，请选择有效的 JSON 文件。没有修改现有记录。';}}
 function cancelImport(){sequence++;pending=null;importStatus='已取消，现有记录保持不变。';}
 function confirmImport(){if(!pending)return;const result=validateBackup(pending,subject,records);pending=null;if(result.error){importStatus=result.error;return;}records.push(...result.additions);save();importStatus=`已合并 ${result.additions.length} 条记录，跳过 ${result.duplicates} 条重复记录。`+(canStore?'已保存到当前浏览器。':'仅临时保留，请导出备份后再离开。');}
</script>
<section class="records-section">
 <div class="section-title"><div><p class="eyebrow">MY LEARNING JOURNAL</p><h2>我的考试记录</h2></div><div class="record-tools"><Button type="button" id="export-records" class="quiet-button" variant="outline" disabled={!records.length} onclick={exportRecords}>导出本机记录 ↓</Button><label class="quiet-button import-label">导入备份 ↑<input id="import-records" type="file" accept="application/json,.json" onchange={importFile}/></label></div></div>
 <p class="storage-note">新增记录只保存在当前浏览器，不会上传或跨设备同步。它们是私人记录，不会自动出现在公开报告中。</p>
 <p id="storage-status" role="status" class="notice" hidden={!warning}>{warning}</p>
 <div id="import-preview" class="notice" hidden={!pending}><p id="import-summary">{summary}</p><Button id="confirm-import" type="button" class="quiet-button" variant="outline" onclick={confirmImport}>确认合并记录</Button><Button id="cancel-import" type="button" class="quiet-button" variant="outline" onclick={cancelImport}>取消导入</Button></div>
 <p id="import-status" role="status">{importStatus}</p>
 <div id="record-list" class="record-list" aria-live="polite">
  {#if subject==='math'}<article class="record"><div><h3>第二单元学业质量测评 · 已收录分析</h3><p class="record-date">报告生成：2026-10-30 · 考试日期未提供</p></div><div class="record-score">82<small> / 100</small></div><p class="record-reflection">成绩来自提供的分析报告。单次成绩只是一条观察记录，不能代表固定能力。</p></article>{/if}
  {#each [...records].reverse() as record}<article class="record"><div><h3>{record.title}</h3><p class="record-date">考试日期：{record.date} · 仅存于本机</p></div><div class="record-score">{record.score}<small> / {record.total}</small></div>{#if record.reflection}<p class="record-reflection">{record.reflection}</p>{/if}</article>{/each}
  {#if !records.length}<p class="empty-records">{subject==='math'?'还没有新增的本机记录。下一次考试后，回来记录新的发现吧。':'还没有考试记录。先留下第一份发现，慢慢看见自己的变化。'}</p>{/if}
 </div>
 <details class="add-record" open><summary>＋ 记录一次考试与发现</summary><aside class="note"><strong>复盘小工具（通用方法，不是自动诊断）：</strong><span>{SUBJECTS[subject].tip}</span></aside>
 <form id="record-form" novalidate onsubmit={submit}><div class="form-grid">
 <label>考试名称<input name="title" required maxlength="80" placeholder="例如：第三单元小测" autocomplete="off" /></label><label>考试日期<input name="date" type="date" required /></label><label>我的分数<input name="score" type="number" min="0" step="0.5" inputmode="decimal" required placeholder="0" /></label><label>满分<input name="total" type="number" min="1" max="10000" step="0.5" inputmode="decimal" required value="100" /></label></div>
 <label>这次的发现 / 下次想试的方法<textarea name="reflection" maxlength="1000" rows="3" placeholder="例如：我会算角度了，但需要先标出哪些角组成平角。"></textarea></label>
 <p id="form-status" role="status" class:error>{feedback}</p><Button class="button" type="submit">保存这份发现 <span>✓</span></Button></form></details>
</section>
