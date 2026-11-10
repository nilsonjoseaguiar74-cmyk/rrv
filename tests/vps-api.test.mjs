import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/app.js";
import { setQueryImplementation, closePool } from "../server/db.js";
import { hashPassword } from "../server/auth/password.js";

let baseUrl; let server; let passwordHash; let sessionHash="";
const user={id:"11111111-1111-4111-8111-111111111111",email:"owner@rrv.digital",name:"Owner RRV",role:"owner"};

before(async()=>{
  passwordHash=await hashPassword("SenhaForte#123");
  setQueryImplementation(async(text,values=[])=>{
    const sql=String(text).replace(/\s+/g," ").trim();
    if(sql==="SELECT 1")return{rows:[{"?column?":1}]};
    if(sql.includes("FROM admin_users WHERE email"))return{rows:values[0]===user.email?[{...user,password_hash:passwordHash}]:[]};
    if(sql.startsWith("INSERT INTO admin_sessions")){sessionHash=values[1];return{rows:[]}};
    if(sql.includes("FROM admin_sessions s JOIN admin_users"))return{rows:values[0]===sessionHash?[{...user,session_id:"22222222-2222-4222-8222-222222222222"}]:[]};
    if(sql.includes("FROM site_settings WHERE status"))return{rows:[{key:"home_headline",value:"Growth.|Experience.|Engineering."}]};
    if(sql.includes("FROM home_sections WHERE status"))return{rows:[{id:"h1",slug:"hero",title:"Hero",content:{},isActive:true,sortOrder:1}]};
    if(sql.includes("FROM cta_blocks WHERE status"))return{rows:[]};
    if(sql.includes("SELECT id,name,whatsapp,email")&&sql.includes("FROM leads"))return{rows:[{id:"l1",name:"Lead Teste",status:"new"}]};
    if(sql.includes("INSERT INTO leads"))return{rows:[],rowCount:1};
    return{rows:[],rowCount:1};
  });
  const app=await createApp({serveFrontend:false});
  await new Promise(resolve=>{server=app.listen(0,"127.0.0.1",resolve)});
  baseUrl=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{await new Promise(resolve=>server.close(resolve));await closePool()});

test("GET /api/health confirma aplicação e banco",async()=>{const response=await fetch(`${baseUrl}/api/health`);assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:"ok",database:"connected"})});

test("POST /api/leads valida consentimento e cria lead",async()=>{const response=await fetch(`${baseUrl}/api/leads`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:"Cliente Teste",whatsapp:"5548999999999",email:"cliente@example.com",projectType:"Sistema",description:"Preciso construir um sistema completo.",problem:"Quero reduzir trabalho manual na operação.",budget:"R$ 5.000+",consent:true})});assert.equal(response.status,201)});

test("login local cria sessão HttpOnly",async()=>{const response=await fetch(`${baseUrl}/api/admin/auth/login`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:user.email,password:"SenhaForte#123"})});assert.equal(response.status,200);const cookie=response.headers.get("set-cookie");assert.match(cookie,/rrv_admin_session=/);assert.match(cookie,/HttpOnly/);globalThis.adminCookie=cookie.split(";")[0]});

test("GET /api/admin/auth/me resolve sessão",async()=>{const response=await fetch(`${baseUrl}/api/admin/auth/me`,{headers:{cookie:globalThis.adminCookie}});assert.equal(response.status,200);assert.equal((await response.json()).user.role,"owner")});

test("GET /api/public/home entrega CMS público",async()=>{const response=await fetch(`${baseUrl}/api/public/home`);assert.equal(response.status,200);const payload=await response.json();assert.equal(payload.settings.home_headline,"Growth.|Experience.|Engineering.")});

test("GET /api/admin/leads exige e aceita sessão",async()=>{assert.equal((await fetch(`${baseUrl}/api/admin/leads`)).status,401);const response=await fetch(`${baseUrl}/api/admin/leads`,{headers:{cookie:globalThis.adminCookie}});assert.equal(response.status,200);assert.equal((await response.json()).items[0].name,"Lead Teste")});
