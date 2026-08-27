export type DruidSeason = 'spring'|'summer'|'autumn'|'winter';
export type DruidForm = 'cervo'|'lobo'|'urso'|'coruja';
export type DruidResonance = 'renascimento'|'metamorfose'|'equilibrio';
export type GardenStage = 'seed'|'sprout'|'fruit';
export type GardenUnit = {id:number;stage:GardenStage;age:number};
export type DruidCycleState = { season:DruidSeason; completed:Set<DruidSeason>; attunement:number; perfectYear:boolean; renewals:number; instinct:number; dissonance:number; form:DruidForm|null; awakening:boolean; avatarActions:number; renewedAvatar:boolean; copaActions:number; reequilibrated:boolean; fruitReserveUsed:boolean; nothingLostUsed:boolean };
export const DRUID_SEASONS:DruidSeason[]=['spring','summer','autumn','winter'];
export const DRUID_SEASON_LABELS:Record<DruidSeason,string>={spring:'Primavera',summer:'Verão',autumn:'Outono',winter:'Inverno'};
export const DRUID_FORM_BY_SEASON:Record<DruidSeason,DruidForm>={spring:'cervo',summer:'lobo',autumn:'urso',winter:'coruja'};
export function createDruidCycle():DruidCycleState{return {season:'spring',completed:new Set(),attunement:0,perfectYear:false,renewals:0,instinct:0,dissonance:0,form:null,awakening:true,avatarActions:0,renewedAvatar:false,copaActions:0,reequilibrated:false,fruitReserveUsed:false,nothingLostUsed:false};}
export function seasonIndex(s:DruidSeason){return DRUID_SEASONS.indexOf(s);}
export function nextSeason(s:DruidSeason):DruidSeason{return DRUID_SEASONS[(seasonIndex(s)+1)%4];}
export function advanceDruidSeason(c:DruidCycleState):DruidCycleState{const completed=new Set(c.completed);completed.add(c.season);const wraps=c.season==='winter';const perfectYear=wraps&&completed.size===4;const season=nextSeason(c.season);return {...c,season,completed:wraps?new Set():completed,perfectYear,awakening:true,form:DRUID_FORM_BY_SEASON[season],attunement:0};}
export function markDruidAttunement(c:DruidCycleState,amount=1){return {...c,attunement:Math.min(3,c.attunement+amount)};}
export function consumeDruidRenewal(c:DruidCycleState){return {...c,renewals:Math.max(0,c.renewals-1)};}
export function createDruidRenewal(c:DruidCycleState){return {...c,renewals:Math.min(1,c.renewals+1),perfectYear:false};}
export function addDruidDissonance(c:DruidCycleState,amount=1){return {...c,dissonance:Math.min(3,c.dissonance+amount)};}
export function clearDruidDissonance(c:DruidCycleState){return {...c,dissonance:0};}
export function activateAvatar(c:DruidCycleState,renewed=false):DruidCycleState{return {...c,avatarActions:renewed?4:3,renewedAvatar:renewed};}
export function tickDruidAvatar(c:DruidCycleState):DruidCycleState{return c.avatarActions>0?{...c,avatarActions:c.avatarActions-1}:c;}
export function prepareDruidReequilibrium(c:DruidCycleState){return c.dissonance===3?{...c,reequilibrated:true}:c;}
export function consumeDruidReequilibrium(c:DruidCycleState){return {...c,dissonance:0,reequilibrated:false};}
export function resetDruidAttempt(){return createDruidCycle();}
export function growGarden(g:GardenUnit[]):GardenUnit[]{return g.map(u=>({...u,stage:u.stage==='seed'?'sprout':u.stage==='sprout'?'fruit':'fruit',age:u.age+1}));}
export function addGardenSeeds(g:GardenUnit[],nextId:number,count:number,max=2):GardenUnit[]{const out=[...g];for(let i=0;i<count&&out.length<max;i++)out.push({id:nextId+i,stage:'seed',age:0});return out;}
export function matureGarden(g:GardenUnit[]):GardenUnit[]{return g.map(u=>({...u,stage:'fruit'}));}
export function consumeGardenFruit(g:GardenUnit[],count=1){const ids=g.filter(u=>u.stage==='fruit').sort((a,b)=>a.age-b.age);const consumed=ids.slice(0,count).map(u=>u.id);return {garden:g.filter(u=>!consumed.includes(u.id)),consumed};}
export function druidSeasonForAbility(id:string):DruidSeason|'cycle'|undefined{const n=Number(id.split(':').pop());return n===4?'spring':n===9?'summer':n===10?'autumn':n===12?'winter':n===13?'cycle':undefined;}
export function pickDruidSeasonalAbility<T extends {effect?:{druidSeason?:DruidSeason|'cycle'}}>(abilities:T[],season:DruidSeason){return abilities.find(a=>a.effect?.druidSeason===season||a.effect?.druidSeason==='cycle')??abilities[0]??null;}
export function formForSeason(s:DruidSeason):DruidForm{return DRUID_FORM_BY_SEASON[s];}
