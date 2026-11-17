import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRecord,validateBackup} from '../src/records.js';
const record={title:'已有记录',date:'2026-10-30',score:82,total:100,reflection:'先解释理由'};
test('legacy record schema remains valid and private text is data',()=>{
 assert.deepEqual(validateRecord(record),{record});
 assert.equal(validateRecord({...record,title:'<img src=x onerror=alert(1)>'}).record.title,'<img src=x onerror=alert(1)>');
 assert.ok(validateRecord({...record,date:'2026-02-30'}).error);
 assert.ok(validateRecord({...record,score:101}).error);
});
test('legacy portable backups merge and deduplicate by subject',()=>{
 const backup={format:'yoyo-learning-records',version:1,subject:'math',records:[record]};
 assert.deepEqual(validateBackup(backup,'math',[record]),{additions:[],duplicates:1});
 assert.deepEqual(validateBackup(backup,'math',[]),{additions:[record],duplicates:0});
 assert.ok(validateBackup(backup,'chinese',[]).error);
});
