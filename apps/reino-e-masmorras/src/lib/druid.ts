export type DruidSeason = 'spring'|'summer'|'autumn'|'winter';
export type DruidForm = 'cervo'|'lobo'|'urso'|'coruja';
export type DruidResonance = 'renascimento'|'metamorfose'|'equilibrio';
export type DruidCycleState = { season:DruidSeason; completed:Set<DruidSeason>; attunement:number; perfectYear:boolean; renewals:number; dissonance:number; form:DruidForm|null; awakening:boolean };
export const DRUID_SEASONS:DruidSeason[]=['spring','summer','autumn','winter'];
export const DRUID_SEASON_LABELS:Record<DruidSeason,string>={spring:'Primavera',summer:'Verão',autumn:'Outono',winter:'Inverno'};
export const DRUID_FORM_BY_SEASON:Record<DruidSeason,DruidForm>={spring:'cervo',summer:'lobo',autumn:'urso',winter:'coruja'};
export function createDruidCycle():DruidCycleState{return {season:'spring',completed:new Set(),attunement:0,perfectYear:false,renewals:0,dissonance:0,form:null,awakening:true};}
export function seasonIndex(s:DruidSeason){return DRUID_SEASONS.indexOf(s);}
export function nextSeason(s:DruidSeason):DruidSeason{return DRUID_SEASONS[(seasonIndex(s)+1)%4];}
export function advanceDruidSeason(c:DruidCycleState):DruidCycleState{const completed=new Set(c.completed);completed.add(c.season);const season=nextSeason(c.season);const perfectYear=completed.size===4;return {...c,season,completed,perfectYear,awakening:true,form:DRUID_FORM_BY_SEASON[season],attunement:0};}
export function markDruidAttunement(c:DruidCycleState,amount=1){return {...c,attunement:Math.min(3,c.attunement+amount)};}
export function consumeDruidRenewal(c:DruidCycleState){return {...c,renewals:Math.max(0,c.renewals-1)};}
export function createDruidRenewal(c:DruidCycleState){return {...c,renewals:Math.min(1,c.renewals+1),perfectYear:false};}
export function addDruidDissonance(c:DruidCycleState,amount=1){return {...c,dissonance:Math.min(3,c.dissonance+amount)};}
export function clearDruidDissonance(c:DruidCycleState){return {...c,dissonance:0};}
