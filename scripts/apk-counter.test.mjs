import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFile} from "node:fs/promises";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {writeAnalyticsConfig,defaultApkCounterUrl} from "./analytics-config.mjs";
const source=await readFile(new URL("../apk-counter.js",import.meta.url),"utf8");
function setup(consent="granted",responses=[204]) {
  const calls=[],retries=[];let ids=0;
  const window={BBOOK_APK_COUNTER_URL:"https://backend.test/api/WebsiteMetrics/apk-click",crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++ids).padStart(12,"0")}`}};
  const context={window,URL,AbortController,localStorage:{getItem:()=>consent},setTimeout:(callback,delay)=>{if(delay!==15000)retries.push(callback);return 1;},clearTimeout:()=>{},fetch:async(url,options)=>{calls.push({url,...options});const response=responses.shift()??204;if(response==="network")throw Error("offline");return {status:response};}};
  vm.runInNewContext(source,context);
  return {window,calls,retries,withdraw:()=>{consent="denied";}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test("consented click sends no account/URL/IP data and each click has a fresh ID",async()=>{
  const test=setup();test.window.BBOOK_RECORD_APK_CLICK();test.window.BBOOK_RECORD_APK_CLICK();await flush();
  assert.equal(test.calls.length,2);assert.notEqual(test.calls[0].body,test.calls[1].body);
  assert.deepEqual(Object.keys(JSON.parse(test.calls[0].body)),["eventId"]);
  assert.equal(test.calls[0].credentials,"omit");assert.equal(test.calls[0].keepalive,true);
});
test("retry retains the same ID and withdrawal cancels pending delivery",async()=>{
  const test=setup("granted",["network",204]);test.window.BBOOK_RECORD_APK_CLICK();await flush();
  assert.equal(test.retries.length,1);test.retries.shift()();await flush();
  assert.equal(test.calls[0].body,test.calls[1].body);
  const withdrawn=setup("granted",[503]);withdrawn.window.BBOOK_RECORD_APK_CLICK();await flush();withdrawn.withdraw();withdrawn.retries.shift()();await flush();assert.equal(withdrawn.calls.length,1);
});
test("denied consent never sends first-party analytics",async()=>{
  const test=setup("denied");test.window.BBOOK_RECORD_APK_CLICK();await flush();assert.equal(test.calls.length,0);
});
test("missing/blank Render variable uses current backend, explicit override works and unsafe URLs fail",async()=>{
  const saved=process.env.APK_COUNTER_API_URL;
  const directory=await mkdtemp(path.join(tmpdir(),"bbook-counter-config-"));
  const output=async()=>{await writeAnalyticsConfig(directory);return readFile(path.join(directory,"analytics-config.js"),"utf8");};
  try {
    delete process.env.APK_COUNTER_API_URL;assert.ok((await output()).includes(JSON.stringify(defaultApkCounterUrl)));
    process.env.APK_COUNTER_API_URL="  ";assert.ok((await output()).includes(JSON.stringify(defaultApkCounterUrl)));
    process.env.APK_COUNTER_API_URL=" https://other.test/api/WebsiteMetrics/apk-click ";assert.ok((await output()).includes('"https://other.test/api/WebsiteMetrics/apk-click"'));
    for(const url of ["http://other.test/api/WebsiteMetrics/apk-click","https://other.test/wrong","https://user:password@other.test/api/WebsiteMetrics/apk-click","https://other.test/api/WebsiteMetrics/apk-click?token=secret"]){process.env.APK_COUNTER_API_URL=url;await assert.rejects(output);}
  } finally {
    if(saved===undefined)delete process.env.APK_COUNTER_API_URL;else process.env.APK_COUNTER_API_URL=saved;
    assert.ok(directory.startsWith(path.join(tmpdir(),"bbook-counter-config-")));await rm(directory,{recursive:true});
  }
});
