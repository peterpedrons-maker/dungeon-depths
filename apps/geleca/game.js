/* =========================================================================
   GELECA — puzzle-platformer de gosma. Pular custa MASSA: cada pulo solta um
   pedaço que vira bloco sólido. Empilhe torres, reabsorva (E), colete gosmas,
   escale paredes, pegue plataformas móveis. Menu com fases, estrelas e
   progresso salvo. Canvas 2D puro, sem backend.
   ========================================================================= */
"use strict";

// -------------------------------------------------------------------------- FÍSICA
const TILE=32, GRAVITY=1700, MOVE=200, AIR=0.78, JUMP_V=600, CLIMB=150,
      GLOB=26, REABSORB_R=10, MAX_FALL=900, MELT_TIME=0.9, BOUNCE=1000, GEM_REVEAL=26, CLIMB_MELT=1.3,
      COYOTE=0.10, JUMPBUF=0.12, LOOKAHEAD=64;   // game-feel: coyote time, buffer de pulo, câmera look-ahead
let hitStop=0;                                    // micro-pausa nos impactos (hit-stop)
function hitstop(t){ if(t>hitStop)hitStop=t; }

// câmera responsiva com ZOOM: o canvas preenche a tela e mostra ~N tiles (zoom in).
const cam={ x:0, y:0, look:0 };
let zoom=2, camViewW=640, camViewH=384, camSafeBottom=0;   // camViewW/H = px do MUNDO visíveis; camSafeBottom = faixa reservada p/ controles

// temas de cor por "mundo": fundo (parallax) + tiles
// amb = ambiente (partículas): 'spore'(sobe) 'ember'(sobe/fogo) 'snow'(desce) 'spark'(flutua) 'dust'(desce)
// deco = silhueta característica: 'hill' 'peak' 'crystal' 'berg' 'stalac' 'chunk'
const THEMES={
  cave:  { sky0:"#123033", sky1:"#0c2024", mote:"126,224,107", tile:"#274036", tilehi:"#365a48",
           top:"#4a9a5a", top2:"#63c878", far:"#183a34", mid:"#20503f", cloud:"170,220,180", amb:"spore", deco:"stalac", glow:null },
  deep:  { sky0:"#101a34", sky1:"#0a1020", mote:"120,170,255", tile:"#20304f", tilehi:"#2e4470",
           top:"#3a6aa0", top2:"#4f8fd0", far:"#161f3e", mid:"#1e2f5a", cloud:"140,170,230", amb:"spark", deco:"crystal", glow:null },
  forge: { sky0:"#3a1c10", sky1:"#1e0f08", mote:"255,160,80",  tile:"#3a271b", tilehi:"#5a3d28",
           top:"#a05a3a", top2:"#d07a4a", far:"#2a160c", mid:"#41210f", cloud:"230,150,110", amb:"ember", deco:"peak", glow:"255,90,20" },
  ice:   { sky0:"#173846", sky1:"#0e222e", mote:"170,230,255", tile:"#254048", tilehi:"#356470",
           top:"#3f8fa8", top2:"#5fc0d8", far:"#12303c", mid:"#1c4653", cloud:"200,235,255", amb:"snow", deco:"peak", glow:null },
  void:  { sky0:"#1a1030", sky1:"#0a0518", mote:"200,150,255", tile:"#2a1c44", tilehi:"#3d2a63",
           top:"#7a4fd0", top2:"#a06ff0", far:"#160c2c", mid:"#241542", cloud:"180,140,240", amb:"spark", deco:"chunk", glow:"150,90,240" },
  glacier:{ sky0:"#20455c", sky1:"#0f2838", mote:"210,245,255", tile:"#3a5566", tilehi:"#547a90",
           top:"#8fd8ee", top2:"#c0f0ff", far:"#173845", mid:"#245266", cloud:"225,245,255", amb:"snow", deco:"berg", glow:"150,225,255" },
  // MUNDO 1 — Vale Verdejante (tema coeso das 15 primeiras fases)
  grove: { sky0:"#1c3d2a", sky1:"#0a1c14", mote:"170,225,160", tile:"#4a3a26", tilehi:"#6b5334",
           top:"#5ec457", top2:"#8bec7c", far:"#153020", mid:"#1e4a32", cloud:"180,235,185", amb:"fireflies", deco:"grove", glow:"120,190,110", art:"vale" },
};
// ARTE de parallax por IA (Mundo 1 · Vale) — 3 camadas PNG (já com alfa de verdade, transparência
// assada no arquivo). Sem getImageData/runtime — funciona em qualquer host.
const BG={}; ["ceu","montanhas","floresta"].forEach(n=>{ try{ const im=new Image(); im.src=n+".png"; BG[n]=im; }catch(e){} });
function imgOk(im){ return im && im.complete && im.naturalWidth>0; }
function groveArtReady(){ return imgOk(BG.ceu) && imgOk(BG.montanhas) && imgOk(BG.floresta); }

// -------------------------------------------------------------------------- FASES
// #=sólido @=início E=saída ^=espinho o=gosma P=placa D=porta H=calor I=GELO(escorrega)
// *=estrela VISÍVEL (coletável)
// S=parede FANTASMA (parece sólida, atravessa)  g=fantasma COM gema secreta dentro (Fez: invisível até entrar)
// G=gema solta invisível  C=desmorona  T=mola
// movers: plataformas móveis [{x,y,w,axis,dist,speed,phase}] (tiles)
// enemies: [{x,y,type:'patrol'|'chaser'|'boss',dist,speed,axis,range,delay}] — chaser/boss caçam; todos barrados por paredes
// LEVELS com secret:true = fase oculta (só destrava achando TODOS os segredos)
const LEVELS = [
  { name:"1 · Primeiro Broto", mass:5, max:5, theme:"grove",
    hint:"", rows:[
    " ######################################################## ",
    "                                                          ",
    "                                                          ",
    "G                                                         ",
    "                                                         #",
    "                                                         #",
    "#                                                        #",
    "#                                                        #",
    "#                                                        #",
    "#                                                        #",
    "#                              *                         #",
    "#                              ###                       #",
    "#                                                        #",
    "#            ####                                        #",
    "#                  o                        o            #",
    "#@                                                    E  #",
    "######################    #########    #########    ######",
    "######################    #########    #########    ######",
    "######################^^^^#########^^^^#########^^^^######"],
    enemies:[{"x":29,"y":15,"dist":5,"speed":1,"axis":"x","type":"patrol"}],
    fakes:[[0,0],[57,0],[0,1],[57,1],[0,2],[57,2],[0,3],[57,3],[0,4],[0,5]]},

  { name:"2 · Colinas Mansas", mass:6, max:6, theme:"grove",
    hint:"", rows:[
    "##########################################################",
    "#                                                        #",
    "#                                                        #",
    "#                                                        #",
    "#                                                        #",
    "#                                                        #",
    "#                                                        #",
    "#                                                        #",
    "#                                                        #",
    "#                                                        #",
    "#                              *                         #",
    "#                            #####                       #",
    "#                                                        #",
    "#           #####                                        #",
    "#           G      o                        o            #",
    "#@                                                    E  #",
    "######################    #########    #########    ######",
    "######################    #########    #########    ######",
    "######################^^^^#########^^^^#########^^^^######"],
    enemies:[{"x":29,"y":15,"dist":5,"speed":1,"axis":"x","type":"patrol"},{"x":43,"y":15,"dist":4,"speed":1,"axis":"x","type":"patrol"}],
    fakes:[[12,14]]},

  { name:"3 · Clareira Musgosa", mass:8, max:8, theme:"grove",
    hint:"", rows:[
    "##################################",
    "#                                #",
    "#                                #",
    "#                                #",
    "#                                #",
    "# @                              #",
    "######                           #",
    "#                                #",
    "#                       o        #",
    "#                   ########     #",
    "#                                #",
    "#                                #",
    "#        o                       #",
    "#     ########                   #",
    "#                                #",
    "#                                #",
    "#                        *       #",
    "#                   ## G ###     #",
    "#                    #   #       #",
    "#                     ###        #",
    "#                     ^^^^^^^    #",
    "#     ########                   #",
    "#                                #",
    "#                                #",
    "#                                #",
    "#                                #",
    "#                            E   #",
    "##############       #############",
    "##############       #############",
    "##############^^^^^^^#############"],
    enemies:[{"x":23,"y":26,"dist":6,"speed":1,"axis":"x","type":"patrol"},{"x":8,"y":12,"dist":5,"speed":1,"axis":"x","type":"patrol"}],
    fakes:[[22,16],[23,16],[24,16],[22,17],[23,17],[24,17],[22,18],[23,18],[24,18]]},

  { name:"4 · Encosta Íngreme", mass:5, max:5, theme:"grove",
    hint:"", rows:[
    "##########################",
    "#                        #",
    "#                        #",
    "#                        #",
    "#                        #",
    "#                        #",
    "#  ########              #",
    "#                        #",
    "#                        #",
    "#                        #",
    "#            ##########  #",
    "#            #           #",
    "#            #           #",
    "#            #           #",
    "#            #     *     #",
    "###########  #           #",
    "#            #           #",
    "#            #           #",
    "#            #           #",
    "# E     ^^   #           #",
    "##############  ##########",
    "#            #           #",
    "#            ##          #",
    "#                        #",
    "#               #######  #",
    "#                        #",
    "#                        #",
    "# @              ^^^^^^  #",
    "####################### G#",
    "##########################"],
    movers:[{"x":15,"y":8,"w":3,"axis":"x","dist":4,"speed":0.6,"phase":0}],
    enemies:[{"x":7,"y":27,"dist":4,"speed":1,"axis":"x","type":"patrol"},{"x":20,"y":19,"dist":4,"speed":1,"axis":"x","type":"patrol"}],
    fakes:[[23,28],[24,28]]},

  { name:"5 · Salto do Cipó", mass:4, max:4, theme:"grove",
    hint:"", rows:[
    "########################################################################",
    "#                                                                      #",
    "#                                                                      #",
    "#                                                                      #",
    "#                                                                      #",
    "#                                                                      #",
    "#                                                                      #",
    "#                                                                      #",
    "#                                                                 G    #",
    "#                                                                      #",
    "#              CCCCC             *                                     #",
    "#                                                                      #",
    "#                                                                      #",
    "#                                                                      #",
    "#                                                                      #",
    "#                         o                   o                        #",
    "#@      T                 # T                 # T                    E #",
    "##########               #####               #####             #########",
    "##########               #####               #####             #########",
    "##########^^^^^^^^^^^^^^^#####^^^^^^^^^^^^^^^#####^^^^^^^^^^^^^#########"],
    movers:[{"x":11,"y":14,"w":3,"axis":"x","dist":11,"speed":0.78,"phase":0},{"x":31,"y":14,"w":3,"axis":"x","dist":11,"speed":0.72,"phase":1},{"x":51,"y":13,"w":3,"axis":"x","dist":9,"speed":0.9,"phase":0.4}],
    enemies:[{"x":36,"y":16,"speed":1.25,"type":"chaser","range":11}]},

  { name:"6 · Toca Morna", mass:7, max:7, theme:"grove",
    hint:"", rows:[
    "##############################################################",
    "#                                                            #",
    "#                                                            #",
    "#                                                            #",
    "#                                                            #",
    "#                                                            #",
    "#                                                            #",
    "#                                                            #",
    "#                                                            #",
    "#                                                            #",
    "#  ######  D                            *                    #",
    "#          D                          #####  ###             #",
    "#          D                                #SgS#            #",
    "#          D                                 SSS             #",
    "# @        D      o                    o          o        E #",
    "#          D        HHHHHHHHHHHHHHH                          #",
    "######P#####################################    ##############",
    "############################################    ##############",
    "############################################^^^^##############"],
    enemies:[{"x":41,"y":15,"dist":5,"speed":1,"axis":"x","type":"patrol"},{"x":52,"y":15,"speed":1.2,"type":"chaser","range":8}]},

  { name:"7 · Bosque Fundo", mass:6, max:6, theme:"grove",
    hint:"", rows:[
    "##################################################################",
    "#                                                                #",
    "#                                                                #",
    "#                                                                #",
    "#                                                                #",
    "#                                                                #",
    "#                                                                #",
    "#                                                                #",
    "#                                                                #",
    "#                             *              ###                 #",
    "#                         #########         #SgS#                #",
    "#                                            SSS                 #",
    "#             o                               o                  #",
    "#         #########                       #########              #",
    "#                                                                #",
    "#                                                                #",
    "# @                                                           E  #",
    "####################    ##############################    ########",
    "####################    ##############################    ########",
    "####################^^^^##############################^^^^########"],
    enemies:[{"x":14,"y":12,"dist":6,"speed":1,"axis":"x","type":"patrol"},{"x":46,"y":12,"dist":6,"speed":1.1,"axis":"x","type":"patrol"},{"x":33,"y":16,"speed":1.3,"type":"chaser","range":11},{"x":58,"y":16,"speed":1.25,"type":"chaser","range":10}]},

  { name:"8 · Pedra Solta", mass:7, max:7, theme:"grove",
    hint:"", rows:[
    "####################################################################################",
    "#                                                                                  #",
    "#                                                                                  #",
    "#                                                                                  #",
    "#                                                                                  #",
    "#                                                                                  #",
    "#                                                     ###                          #",
    "#                                                    #SgS#                         #",
    "#                                                     SSS                          #",
    "#                                                      *                           #",
    "#                                                   #######                        #",
    "#                                                                                  #",
    "#         *                                                                        #",
    "#       #####                                                             #######  #",
    "#                             o                             o                      #",
    "#                                                   CCCCCCC                        #",
    "#                                                                                  #",
    "#                         o                                                        #",
    "# @                 T      HHHHHHHHHHHH      T                    T              E #",
    "################         ###############          ############         #############",
    "################         ###############          ############         #############",
    "################^^^^^^^^^###############^^^^^^^^^^############^^^^^^^^^#############"],
    movers:[{"x":16,"y":17,"w":4,"axis":"x","dist":7,"speed":0.78,"phase":0},{"x":40,"y":17,"w":4,"axis":"x","dist":8,"speed":0.82,"phase":0.5},{"x":62,"y":17,"w":4,"axis":"x","dist":7,"speed":0.88,"phase":0.3}],
    enemies:[{"x":55,"y":9,"dist":3,"speed":1.1,"axis":"x","type":"patrol"},{"x":30,"y":18,"speed":1.25,"type":"chaser","range":10},{"x":74,"y":18,"speed":1.2,"type":"chaser","range":9}]},

  { name:"9 · Campo Sereno", mass:7, max:7, theme:"grove",
    hint:"", rows:[
    "######################################################################",
    "#                                                                    #",
    "#                                                                    #",
    "#                                                                    #",
    "#                                                                    #",
    "#                                                                    #",
    "#                                                                    #",
    "#                                  *                                 #",
    "#                                #####                               #",
    "#                                 ###                                #",
    "#     o #                        #SgS#                       #o      #",
    "#    ######                       SSS                      ######    #",
    "#       #                                                    #       #",
    "#       #                                                    #       #",
    "#       #                                                    #       #",
    "#       #                                                    #       #",
    "# @     #                                                    #     E #",
    "##############                                           #############",
    "##############                                           #############",
    "##############^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^#############"],
    movers:[{"x":14,"y":13,"w":4,"axis":"x","dist":12,"speed":0.72,"phase":0},{"x":40,"y":13,"w":4,"axis":"x","dist":13,"speed":0.78,"phase":0.6},{"x":30,"y":9,"w":3,"axis":"y","dist":5,"speed":0.7,"phase":0}],
    enemies:[{"x":35,"y":16,"speed":1.25,"type":"chaser","range":11},{"x":20,"y":16,"speed":1.15,"type":"chaser","range":9}]},

  { name:"10 · Ramagem Alta", mass:6, max:6, theme:"grove",
    hint:"", rows:[
    "####################################################",
    "#                                                  #",
    "#                                                  #",
    "#                                                  #",
    "#                                                  #",
    "#                                     SSS   E      #",
    "#                                    #SgS######    #",
    "#                            o       #SSS#         #",
    "#                         ########    ###          #",
    "#                                                  #",
    "#                                                  #",
    "#                                                  #",
    "#                  o          T                    #",
    "#               #######                            #",
    "#                                                  #",
    "#                                                  #",
    "#                                                  #",
    "#         *         T                              #",
    "#     #######                                      #",
    "#                                                  #",
    "#                                                  #",
    "# @                                                #",
    "#       T                                          #",
    "########################     #####^^^^##############",
    "########################     #######################",
    "########################^^^^^#######################"],
    enemies:[{"x":27,"y":7,"dist":4,"speed":1,"axis":"x","type":"patrol"},{"x":40,"y":5,"speed":1.2,"type":"chaser","range":9}]},

  { name:"11 · Cipoal Denso", mass:6, max:6, theme:"grove",
    hint:"", rows:[
    "##################################",
    "#                                #",
    "#                                #",
    "#                                #",
    "#        #                       #",
    "#        #    * E                #",
    "#        ##########              #",
    "#        #                       #",
    "#        #                       #",
    "#        #                       #",
    "#     ####  o                    #",
    "#    #SgSS######                 #",
    "#    #SSSS                       #",
    "#     ####                       #",
    "#        #                       #",
    "#        #  o                    #",
    "#        ######                  #",
    "#        #                       #",
    "#        #                       #",
    "#        #                       #",
    "#        #  o                    #",
    "#        ######                  #",
    "#        #                       #",
    "#        #          @            #",
    "#        #                       #",
    "##################################",
    "##################################",
    "##################################"],
    enemies:[{"x":24,"y":24,"dist":5,"speed":1,"axis":"x","type":"patrol"},{"x":11,"y":10,"dist":3,"speed":1,"axis":"x","type":"patrol"}]},

  { name:"12 · A Fenda", mass:6, max:6, theme:"grove",
    hint:"", rows:[
    "##############################################################################",
    "#                                                                            #",
    "#                                                                            #",
    "#                                                                            #",
    "#                                                                            #",
    "#                                                                            #",
    "#                                                                            #",
    "#                                                                            #",
    "#                                  *                                         #",
    "#                                #####                                       #",
    "#                                                                            #",
    "#                                                                            #",
    "#     ##                                    CCCCCCC                          #",
    "#    #gS#                                                                    #",
    "#     SS                                                                     #",
    "# @       o                                               o                E #",
    "#                                                                            #",
    "############                   #####                   #####             #####",
    "############                   #####                   #####             #####",
    "############^^^^^^^^^^^^^^^^^^^#####^^^^^^^^^^^^^^^^^^^#####^^^^^^^^^^^^^#####"],
    movers:[{"x":13,"y":14,"w":4,"axis":"x","dist":16,"speed":0.72,"phase":0},{"x":37,"y":14,"w":4,"axis":"x","dist":16,"speed":0.78,"phase":0.7},{"x":61,"y":14,"w":4,"axis":"x","dist":10,"speed":0.85,"phase":0.3}],
    enemies:[{"x":34,"y":8,"dist":3,"speed":1.1,"axis":"x","type":"patrol"},{"x":48,"y":16,"speed":1.25,"type":"chaser","range":10}]},

  { name:"13 · Raízes Antigas", mass:8, max:8, theme:"grove",
    hint:"", rows:[
    "##################################################################",
    "#                                                                #",
    "#                                                                #",
    "#                                                                #",
    "#                                                                #",
    "#                                                                #",
    "#   ###                                                          #",
    "#  #SgS#                                                         #",
    "#   SSS                                                          #",
    "#                               *                                #",
    "#  ######                                                        #",
    "#          D                  CCCCC                              #",
    "#          D                                                     #",
    "#          D                                                     #",
    "#          D          o                     o          o         #",
    "# @        D                                                  E  #",
    "#          D   HHHHHHHHHHHHHHT       HHHHHHHHHHHHHHH T           #",
    "######P###########################################################",
    "##################################################################",
    "##################################################################"],
    enemies:[{"x":44,"y":15,"speed":1.25,"type":"chaser","range":9},{"x":8,"y":15,"dist":4,"speed":1,"axis":"x","type":"patrol"},{"x":34,"y":9,"dist":2,"speed":1,"axis":"x","type":"patrol"}]},

  { name:"14 · Espinhal Verde", mass:6, max:6, theme:"grove",
    hint:"", rows:[
    "######################################################################",
    "#                                                                    #",
    "#                                                                    #",
    "#                                                                    #",
    "#                                                                    #",
    "#                                                                    #",
    "#                                                                    #",
    "#                                                                    #",
    "#                                 *                                  #",
    "#                               #####                                #",
    "#                                                                    #",
    "#                                                                    #",
    "#                                                              ##    #",
    "#           CCCCCCC           CCCCCCCCC         CCCCCCCCCCC   #gS#   #",
    "#                                                              SS    #",
    "# @                     o                  o                   o   E #",
    "#                        #                  #                        #",
    "##########             #####             #####               #########",
    "##########             #####             #####               #########",
    "##########^^^^^^^^^^^^^#####^^^^^^^^^^^^^#####^^^^^^^^^^^^^^^#########"],
    enemies:[{"x":34,"y":8,"dist":3,"speed":1.1,"axis":"x","type":"patrol"},{"x":52,"y":16,"speed":1.3,"type":"chaser","range":10},{"x":20,"y":16,"speed":1.2,"type":"chaser","range":9}]},

  { name:"15 · Cume do Vale", mass:8, max:8, theme:"grove",
    hint:"", rows:[
    "############################################################################################",
    "#                                                                                          #",
    "#                                                                                          #",
    "#                                                                                          #",
    "#                                                                                          #",
    "#                                                                                          #",
    "#                                                                                          #",
    "#                                                                                          #",
    "#                                                     *                                    #",
    "#      ###                                        #########                                #",
    "#     #SgS#                                                                                #",
    "#      SSS                                                                                 #",
    "#         *                                                                                #",
    "#     #####                                                                           ######",
    "#                                                 CCCCCCCCC                                #",
    "#                                                                                          #",
    "#                                                                                          #",
    "#                                                                                          #",
    "#                             o                                 o               o          #",
    "#                         o                                                                #",
    "# @         T                   THHHHHHHHHHHHHHHHH    T                 T                E #",
    "##############             #######               #######             #####           #######",
    "##############             #######               #######             #####           #######",
    "##############^^^^^^^^^^^^^#######^^^^^^^^^^^^^^^#######^^^^^^^^^^^^^#####^^^^^^^^^^^#######"],
    movers:[{"x":15,"y":17,"w":4,"axis":"x","dist":10,"speed":0.78,"phase":0},{"x":34,"y":17,"w":4,"axis":"x","dist":12,"speed":0.82,"phase":0.3},{"x":57,"y":17,"w":4,"axis":"x","dist":11,"speed":0.8,"phase":0.5},{"x":75,"y":17,"w":4,"axis":"x","dist":9,"speed":0.88,"phase":0.2}],
    enemies:[{"x":54,"y":8,"dist":3,"speed":1.1,"axis":"x","type":"patrol"},{"x":30,"y":20,"speed":1.3,"type":"chaser","range":10},{"x":70,"y":20,"speed":1.35,"type":"chaser","range":11}]},

  { name:"16 · A Gosma-Mãe", mass:11, max:11, theme:"void", secret:true,
    hint:"", rows:[
    "################################################################################",
    "#                                                                              #",
    "#                                                                              #",
    "#                                                                              #",
    "#                                                                              #",
    "#                                                       #                      #",
    "#                                                       #                   E  #",
    "#                                                       #             ##########",
    "#                                    #####              #                      #",
    "#                                                    ####                      #",
    "#                                o                      #                      #",
    "#                              ####                     #                      #",
    "#                                                    ####    ####              #",
    "#        #####                                          #                      #",
    "#                        ####                           #                      #",
    "#    @     o                                          o # T       o            #",
    "###############T################################################################",
    "#################      ####################          ######         ############",
    "#################      ####################          ######         ############",
    "#################^^^^^^####################^^^^^^^^^^######^^^^^^^^^############"],
    movers:[{"x":44,"y":14,"w":4,"axis":"x","dist":8,"speed":0.7,"phase":0}],
    enemies:[{"x":11,"y":12,"dist":4,"speed":1,"axis":"x","type":"patrol"},{"x":38,"y":16,"speed":1.2,"type":"chaser","range":9},{"x":63,"y":11,"dist":3,"speed":1,"axis":"x","type":"patrol"},{"x":70,"y":16,"speed":1.25,"type":"chaser","range":9}],
    devourer:{"x0":-4,"speed":72,"accel":1.8}}
];

// PROTÓTIPO VISUAL — Mundo 2 (Água). Só cenário aquático pra ver o clima; sem mecânica de água ainda.
// '~' = água (não-sólida por enquanto). Abre pelo botão "🌊 Protótipo: Água" no menu.
const WATER_PROTO = { name:"~ · Protótipo · Caverna Alagada", mass:6, max:6, theme:"deep", hint:"Pesado: mergulhe. No fundo largue massa p/ ficar leve e boiar até a saída.", rows:[
  "##################################",
  "##################################",
  "# @    ###########################",
  "###    ###########################",
  "###~~~~####################~E~~###",
  "###~~~~####################~~~~###",
  "###~~~^####################~~~^###",
  "###~~~~####################~~~~###",
  "###^~~~####################^~~~###",
  "###~~~~####################~~~~###",
  "###~~~^####################~~~^###",
  "###~~~~####################~~~~###",
  "###^~~~####################~^~~###",
  "###~~~~####################~~~~###",
  "###~~~~~~~~~~~~~~~~~~~*~~~~^~~~###",
  "###~~~~~~~~~~~~~~~~~~~~~~~~~~~~###",
  "###~~~~~~~~~~~~~~~~~~~~~~~~~~~^###",
  "###~~~~~~~~~~~^^^^^^~~~~~~~~~~~###",
  "##################################",
  "##################################",
  "##################################"] };

// -------------------------------------------------------------------------- PROGRESSO
const SAVE_KEY="geleca_save_v2";
function loadSave(){ try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY))||{}; return {unlocked:s.unlocked||0, stars:s.stars||{}, coins:s.coins||{}, gems:s.gems||{}}; }catch(e){ return {unlocked:0,stars:{},coins:{},gems:{}}; } }
function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }
let save = loadSave();
function starsFor(idx, massLeft){
  const L=LEVELS[idx];
  if(massLeft >= Math.ceil(L.mass*0.6)) return 3;
  if(massLeft >= 2) return 2;
  return 1;
}

// -------------------------------------------------------------------------- ESTADO
const canvas=document.getElementById("game"), ctx=canvas.getContext("2d");
const el=id=>document.getElementById(id);
let COLS,ROWS, level, solidTiles,spikes,pickups,plates,doors,heatZones,movers,springs,enemies,gems,stars,fakes,crumbles,iceTiles,water,exitRect,startPos,theme;
let blob, globs, particles=[], motes=[], rings=[], trail=[], shots=[], levelIndex=0, state="menu"; // menu|play|complete|dead
let tramp=[];   // SEGREDO: trampolins formados por 4 gelecas em 2x2
let levelTime=0, T=0, shake=0, last=0, deaths=0, transition=0;

// entrada
const IN={ kb:{left:false,right:false,down:false}, joyX:0, joyY:0 };
let jumpEdge=false, grabEdge=false;
// AUTOPILOT (bot que resolve as fases sozinho, pra assistir)
let botOn=false, botWait=0;
const bot={mx:0,down:false,jump:false,grab:false,jumpCD:0,lastX:0,antiStuck:0,progT:0,bestD:null};

// -------------------------------------------------------------------------- VALIDAÇÃO
(function(){ LEVELS.forEach((L,i)=>{ const w=L.rows[0].length;
  L.rows.forEach((r,y)=>{ if(r.length!==w) console.error(`LEVEL ${i+1} linha ${y}: ${r.length}≠${w}`); });
  const j=L.rows.join(""); if(!j.includes("@"))console.error(`LEVEL ${i+1} sem @`); if(!j.includes("E"))console.error(`LEVEL ${i+1} sem E`);
}); })();

// -------------------------------------------------------------------------- TOAST
let toastT; function toast(m,k){ /* reservado */ }

// ==========================================================================
// MENU / SELEÇÃO DE FASES
// ==========================================================================
function showMenu(){
  state="menu"; stopMusic(); winTimer=0; winThen=null; customCtx=null;
  ["screen-game","screen-custom","screen-editor"].forEach(id=>el(id).classList.remove("active"));
  el("screen-menu").classList.add("active");
  buildFireflies();
  buildLevelGrid();
}
// vaga-lumes flutuando ao fundo do menu (clima do Vale Verdejante)
function buildFireflies(){
  const box=el("menu-fireflies"); if(!box || box.childElementCount) return;
  let html="";
  for(let i=0;i<16;i++){ const x=Math.round(Math.random()*100), y=Math.round(Math.random()*100),
    d=(3.5+Math.random()*4).toFixed(1), delay=(-Math.random()*6).toFixed(1),
    s=(2+Math.random()*3).toFixed(1), dx=(Math.random()*40-20).toFixed(0), dy=(Math.random()*40-20).toFixed(0);
    html+=`<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;`
      +`--dx:${dx}px;--dy:${dy}px;animation-duration:${d}s;animation-delay:${delay}s"></i>`; }
  box.innerHTML=html;
}
const LV_ICONS=["🌱","⛰️","🕳️","🧗","🌉","🔥","👾","🏔️","❄️","🧊","🥶","🌌","🌋","💠","🏁"];
// TEMPORÁRIO (modo teste): destrava TODAS as fases, inclusive o chefe/secreta, pra testar tudo.
// Voltar pra false pra restaurar a progressão normal.
const UNLOCK_ALL=true;
// Posições dos 15 nós em % da ARTE do mapa (mapa.png) — a mão, encaixados nas
// clareiras SECAS do vale (Mundo 1 não tem água): todas as fases ficam ACIMA do
// rio. A fase 15 para logo antes do riacho — o rio abaixo é a prévia do Mundo 2.
const MAP_SPOTS=[
  {x:31,y:14}, {x:51,y:12}, {x:70,y:15},   // 1-3  alto do vale
  {x:71,y:25}, {x:50,y:24}, {x:29,y:26},   // 4-6
  {x:25,y:36}, {x:48,y:35}, {x:70,y:37},   // 7-9  campina central
  {x:71,y:47}, {x:49,y:46}, {x:27,y:47},   // 10-12
  {x:31,y:57}, {x:51,y:58}, {x:68,y:55},   // 13-15 borda seca, logo antes do rio
];
// A fase SECRETA (16 · Gosma-Mãe) NÃO aparece como nó: fica só um brilho discreto
// escondido lá embaixo (na região do rio = território do Mundo 2), uma "dica"
// de que há algo ali pra quem reparar — nunca um nó exposto.
const SECRET_SPOT={x:77,y:92};
// mini-estrelas (rating) coladas embaixo do nó do mapa
function starRow(st){ let h='<span class="mn-stars">'; for(let k=0;k<3;k++) h+=`<i class="${k<st?"on":""}">★</i>`; return h+"</span>"; }
// SELEÇÃO DE FASE estilo Mario World: um MAPA com caminho serpenteante e nós.
function buildLevelGrid(){
  const map=el("level-grid"); map.innerHTML="";
  const coinsIn=i=>(LEVELS[i].rows.join("").match(/\*/g)||[]).length;      // ⭐ estrelas VISÍVEIS
  const coinGot=i=>Math.min(coinsIn(i), save.coins[i]||0);
  const secretGot=i=>save.gems[i]||0;                                      // 💎 segredos (só o que achou)
  let totalCoins=0, gotCoins=0, foundSecrets=0, ratingSum=0, done=0;
  const NORMAL=LEVELS.filter(L=>!L.secret).length;
  LEVELS.forEach((L,i)=>{ if(L.secret)return; totalCoins+=coinsIn(i); gotCoins+=coinGot(i); foundSecrets+=secretGot(i);
    ratingSum+=(save.stars[i]||0); if((save.stars[i]||0)>0) done++; });
  const totalSecrets=NORMAL, allSecrets=foundSecrets>=totalSecrets;
  // progresso do MUNDO
  const pct=Math.round(done/NORMAL*100);
  const bar=el("world-bar"); if(bar) bar.style.width=pct+"%";
  const pctEl=el("world-pct"); if(pctEl) pctEl.textContent=pct+"%";
  const stats=el("menu-stats");
  if(stats) stats.innerHTML=
    `<span class="chip">✅ ${done}/${NORMAL}</span>`
    + `<span class="chip" style="color:var(--gold)">⭐ ${gotCoins}/${totalCoins}</span>`
    + `<span class="chip" style="color:var(--gold)">★ ${ratingSum}/${NORMAL*3}</span>`
    + (foundSecrets>0 ? `<span class="chip" style="color:var(--purple)">💎 ${foundSecrets}</span>` : "");

  // "próxima" fase NORMAL (primeira desbloqueada e ainda não concluída) — onde a geleca-peão fica
  let nextIdx=-1; for(let i=0;i<NORMAL;i++){ if(i<=save.unlocked && !(save.stars[i]>0)){ nextIdx=i; break; } }
  if(nextIdx<0) nextIdx = NORMAL-1;                                // tudo feito → peão fica no topo

  // --- geometria da arte (mapa.png) ---
  const W=map.clientWidth||420, H=map.clientHeight||Math.round(W/0.5581);

  // --- TRILHA (SVG): traçado ORGÂNICO e discreto ligando os 15 nós ---
  const NS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(NS,"svg"); svg.setAttribute("class","map-trail");
  svg.setAttribute("viewBox","0 0 "+W+" "+H); svg.setAttribute("preserveAspectRatio","none");
  const P=[]; for(let k=0;k<NORMAL;k++) P.push({x:MAP_SPOTS[k].x/100*W, y:MAP_SPOTS[k].y/100*H});
  // curva suave (Catmull-Rom → Bézier): serpenteia naturalmente pelos nós, sem cantos secos.
  // Guardo cada segmento pra poder pintar SÓ o trecho já percorrido (progresso na trilha).
  const head="M "+P[0].x.toFixed(1)+" "+P[0].y.toFixed(1), seg=[];
  for(let k=0;k<P.length-1;k++){
    const p0=P[k-1]||P[k], p1=P[k], p2=P[k+1], p3=P[k+2]||P[k+1];
    const c1x=p1.x+(p2.x-p0.x)/6, c1y=p1.y+(p2.y-p0.y)/6;
    const c2x=p2.x-(p3.x-p1.x)/6, c2y=p2.y-(p3.y-p1.y)/6;
    seg.push(" C "+c1x.toFixed(1)+" "+c1y.toFixed(1)+" "+c2x.toFixed(1)+" "+c2y.toFixed(1)+" "+p2.x.toFixed(1)+" "+p2.y.toFixed(1));
  }
  const d=head+seg.join("");
  const doneN=Math.max(0,Math.min(nextIdx, seg.length));        // trecho já concluído (até o nó atual)
  const dDone=doneN>0 ? head+seg.slice(0,doneN).join("") : "";
  const base=document.createElementNS(NS,"path"); base.setAttribute("d",d); base.setAttribute("class","trail-base");
  const dash=document.createElementNS(NS,"path"); dash.setAttribute("d",d); dash.setAttribute("class","trail-dash");
  svg.appendChild(base); svg.appendChild(dash);
  if(dDone){ const done=document.createElementNS(NS,"path"); done.setAttribute("d",dDone); done.setAttribute("class","trail-done"); svg.appendChild(done); }
  map.appendChild(svg);

  // --- 15 NÓS de fase (o segredo NÃO entra aqui) ---
  const customLv=loadCustom();
  for(let i=0;i<NORMAL;i++){
    const custom=customLv[i+1];                                          // fase editada por você substitui a oficial
    const L=custom||LEVELS[i], p=MAP_SPOTS[i], st=save.stars[i]||0, nm=(L.name.split("·")[1]||"").trim();
    const locked=!UNLOCK_ALL && i>save.unlocked, sGot=secretGot(i);
    const node=document.createElement("button");
    node.style.left=p.x+"%"; node.style.top=p.y+"%"; node.style.animationDelay=(i*0.04).toFixed(2)+"s";
    node.className="map-node"+(locked?" locked":"")+(st>0?" done":"")+(i===nextIdx?" next":"");
    node.title=nm+(custom?" (sua versão)":"");
    node.innerHTML = `<b class="mn-num">${i+1}</b>`
      + (locked ? "" : starRow(st)+(sGot>0?`<span class="mn-gem">💎</span>`:""))
      + (custom?`<span class="mn-edit">✎</span>`:"")
      + `<span class="mn-name">${nm}</span>`;
    if(!locked) node.addEventListener("click",()=>{ audio(); startGame(i); });
    map.appendChild(node);
  }

  // --- DICA da fase SECRETA: só um brilho discreto no cantinho (nunca um nó rotulado) ---
  const si=LEVELS.findIndex(L=>L.secret);
  if(si>=0){
    const open=allSecrets||UNLOCK_ALL;   // achou TODOS os segredos? (ou modo teste)
    const hint=document.createElement("button");
    hint.className="map-secret"+(open?" open":"");
    hint.style.left=SECRET_SPOT.x+"%"; hint.style.top=SECRET_SPOT.y+"%";
    hint.title=open?"A Gosma-Mãe":"";
    hint.setAttribute("aria-label", open?"Fase secreta — A Gosma-Mãe":"");
    // desbloqueada → nó VISÍVEL e clicável (o chefe revelado); senão → só um brilho discreto
    hint.innerHTML = open
      ? `<span class="ms-boss">👾</span><span class="mn-name">Gosma-Mãe</span>`
      : `<i class="sp sp1">✦</i><i class="sp sp2">✦</i><i class="sp sp3">✧</i>`;
    if(open) hint.addEventListener("click",()=>{ audio(); startGame(si); });
    else hint.disabled=true;
    map.appendChild(hint);
  }

  // --- GELECA-PEÃO no nó atual (quicando) ---
  const pp=MAP_SPOTS[nextIdx]||MAP_SPOTS[0];
  const pawn=document.createElement("div"); pawn.className="map-pawn";
  pawn.style.left=pp.x+"%"; pawn.style.top=pp.y+"%";
  pawn.innerHTML=`<span class="mp-body"><i></i><i></i></span>`;
  map.appendChild(pawn);
}
function startGame(i){
  levelIndex=i; customCtx=null;
  el("screen-menu").classList.remove("active");
  el("screen-game").classList.add("active");
  loadLevel(i);
}
// joga um objeto de fase (custom/editor) direto no motor. ctx: 'edit' (voltar ao editor) | 'list'
let customCtx=null;
function playLevelObj(obj, ctx){
  customCtx=ctx||'list'; levelIndex=-1;
  ["screen-menu","screen-custom","screen-editor"].forEach(id=>el(id).classList.remove("active"));
  el("screen-game").classList.add("active");
  loadLevelObj(obj);
}

// ==========================================================================
// CARREGAR / RESETAR
// ==========================================================================
// se existir uma fase CUSTOM salva no slot correspondente (Fase idx+1), ela SUBSTITUI a oficial no mapa
function loadLevel(idx){ const c=loadCustom(); loadLevelObj(c[idx+1]||LEVELS[idx]); }
function loadLevelObj(obj){
  level=obj; ROWS=obj.rows.length; COLS=obj.rows[0].length;
  fitCanvas();                            // dimensiona o canvas à tela e calcula o zoom
  theme=THEMES[obj.theme] || THEMES.cave;
  if(musicOn) startMusic(obj.theme);      // trilha ambiente do mundo
  // motes de fundo
  motes=[]; for(let i=0;i<26;i++) motes.push({ x:Math.random()*canvas.width, y:Math.random()*canvas.height,
    r:1+Math.random()*2.5, s:6+Math.random()*14, ph:Math.random()*6.28 });
  showHint(obj.hint||"");
  levelTime=0; transition=1; resetLevel();
  bot.progT=0; bot.bestD=null; botWait=0;        // zera o watchdog do autopilot a cada fase
}
// (re)constrói TODAS as entidades a partir do grid — chamado no load E no reinício,
// então coletáveis (gosma extra, estrelas), desmoronáveis, molas e inimigos SEMPRE voltam ao morrer/reiniciar.
function buildEntities(){
  solidTiles=[];spikes=[];pickups=[];plates=[];doors=[];heatZones=[];movers=[];springs=[];enemies=[];gems=[];stars=[];fakes=[];crumbles=[];iceTiles=[];water=[];
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const ch=level.rows[y][x], r={x:x*TILE,y:y*TILE,w:TILE,h:TILE};
    if(ch==="#")solidTiles.push(r);
    else if(ch==="I"){solidTiles.push(r);iceTiles.push(r);}                                 // GELO: sólido porém ESCORREGADIO
    else if(ch==="^")spikes.push(r);
    else if(ch==="o")pickups.push({x:x*TILE+16,y:y*TILE+16,r:9});
    else if(ch==="P"){solidTiles.push(r);plates.push(r);}
    else if(ch==="D")doors.push(r);
    else if(ch==="H")heatZones.push(r);
    else if(ch==="T"){solidTiles.push(r);springs.push({x:r.x,y:r.y,w:TILE,h:TILE,sq:0});}  // mola
    else if(ch==="G")gems.push({x:x*TILE+16,y:y*TILE+16,r:8,got:false,rev:0});               // gema = SEGREDO oculto: INVISÍVEL até você entrar no esconderijo
    else if(ch==="g"){ fakes.push({x:r.x,y:r.y,w:TILE,h:TILE,rev:0});                        // 'g' = parede FANTASMA com gema DENTRO: bloco parece 100% sólido,
      gems.push({x:x*TILE+16,y:y*TILE+16,r:8,got:false,rev:0}); }                             //       a gema só materializa quando você atravessa e entra
    else if(ch==="*")stars.push({x:x*TILE+16,y:y*TILE+16,r:9,got:false});                   // estrela = coletável VISÍVEL
    else if(ch==="S")fakes.push({x:r.x,y:r.y,w:TILE,h:TILE,rev:0});                         // parede FANTASMA: parece sólida, mas você atravessa (some ao entrar)
    else if(ch==="C")crumbles.push({x:r.x,y:r.y,w:TILE,h:TILE,solid:true,t:0,resp:0});     // plataforma que desmorona
    else if(ch==="~")water.push(r);                                                        // ÁGUA (protótipo visual: só cenário por enquanto)
    else if(ch==="E")exitRect={x:x*TILE+4,y:y*TILE+2,w:TILE-8,h:TILE-4};
    else if(ch==="@")startPos={x:x*TILE,y:y*TILE};
  }
  (level.movers||[]).forEach(m=>movers.push({
    x0:m.x*TILE, y0:m.y*TILE, w:m.w*TILE, h:GLOB, axis:m.axis,
    dist:m.dist*TILE, speed:m.speed, phase:m.phase||0,
    x:m.x*TILE, y:m.y*TILE, dx:0, dy:0 }));
  (level.enemies||[]).forEach(e=>{
    const boss=e.type==="boss", ew=boss?58:TILE-6, eh=boss?58:TILE-6;
    const ex=e.x*TILE+3, ey=e.y*TILE+3-(eh-(TILE-6));   // alinha a base do inimigo à linha do chão
    enemies.push({ x0:ex, y0:ey, x:ex, y:ey, w:ew, h:eh,
      dist:(e.dist||0)*TILE, speed:e.speed, axis:e.axis||"x",
      type:e.type||"patrol", range:(e.range||7)*TILE, delay:e.delay!==undefined?e.delay:(boss?1.4:0),
      hp:boss?(e.hp||3):0, hitT:0, mad:0, alert:0, dir:1 });
  });
  // CAMADA de paredes FANTASMA (overlay): cobre a célula com "rocha" SEM apagar o que há
  // atrás (gema/estrela/gosma). Usado pelo editor pra esconder recompensas.
  (level.fakes||[]).forEach(f=>{ fakes.push({x:f[0]*TILE,y:f[1]*TILE,w:TILE,h:TILE,rev:0}); });
}
function resetLevel(){
  buildEntities();                 // <-- restaura coletáveis e reseta inimigos/desmoronáveis
  globs=[]; particles=[]; rings=[]; trail=[]; shots=[]; tramp=[]; winTimer=0; winThen=null; hitStop=0; cam.look=0;
  blob={ x:startPos.x, y:startPos.y, w:0,h:0, vx:0,vy:0, onGround:false,wall:0,cling:false,
         mass:level.mass, flash:0, clingLock:0, meltAcc:0, climbAcc:0, hurtT:0, melting:false, blink:0, rideMover:null };
  sizeBlob(); blob.y=startPos.y+TILE-blob.h;
  // DES-ENCRAVA: se o blob (que é mais largo que 1 tile) nasce sobreposto a uma
  // parede, empurra-o pra fora pelo lado de menor sobreposição. Sem isso, o
  // primeiro movimento ejeta o blob pra dentro do vão e ele "escala" pra fora do mapa.
  for(let it=0; it<8; it++){ let hit=null;
    for(const s of solidTiles){ if(overlaps(blob,s)){ hit=s; break; } }
    if(!hit) break;
    const outR=(hit.x+hit.w)-blob.x, outL=(blob.x+blob.w)-hit.x;
    blob.x = (outR<=outL) ? hit.x+hit.w : hit.x-blob.w;
  }
  // MURALHA DEVORADORA (boss tipo "come a tela"): começa à esquerda e avança pra direita
  if(level.devourer){ devourEdge=(level.devourer.x0!=null?level.devourer.x0:-5)*TILE; devourSpeed=level.devourer.speed||34; devourWarn=0; }
  else { devourEdge=null; devourSpeed=0; devourWarn=0; }
  camFollow(true);
  state="play"; hideOverlay(); renderHud();
}
let devourEdge=null, devourSpeed=0, devourWarn=0;
function sizeBlob(){ const s=14+blob.mass*3.0, cx=blob.x+blob.w/2, bt=blob.y+blob.h;
  blob.w=s;blob.h=s; blob.x=cx-s/2; blob.y=bt-s; }

// ==========================================================================
// COLISÃO / FÍSICA
// ==========================================================================
function overlaps(a,b){ return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y; }
function plateOn(){ if(!plates.length)return false;
  for(const p of plates){ const z={x:p.x,y:p.y-6,w:p.w,h:p.h};
    if(overlaps(blob,z))return true; for(const g of globs)if(g.solid&&overlaps(g,z))return true; }
  return false; }
function solidsList(){ const l=solidTiles.slice();
  for(const g of globs)if(g.solid)l.push(g);
  for(const m of movers)l.push({x:m.x,y:m.y,w:m.w,h:m.h});
  for(const c of crumbles)if(c.solid)l.push(c);
  if(doors.length&&!plateOn())for(const d of doors)l.push(d);
  return l; }
function moveAxis(dx,dy){ const list=solidsList();
  blob.x+=dx;
  for(const s of list)if(overlaps(blob,s)){
    if(dx>0){ blob.x=s.x-blob.w; blob.wall=1; }
    else if(dx<0){ blob.x=s.x+s.w; blob.wall=-1; }
    else { // parado, porém EMBUTIDO (cresceu ao reabsorver, ou uma plataforma o empurrou):
           // sai pelo lado de MENOR sobreposição em vez de ficar preso e depois ser "arremessado".
      const outR=(s.x+s.w)-blob.x, outL=(blob.x+blob.w)-s.x;
      if(outR<outL){ blob.x=s.x+s.w; blob.wall=-1; } else { blob.x=s.x-blob.w; blob.wall=1; }
    }
    blob.vx=0;
  }
  // Y: resolve SÓ contra sólidos que o blob de fato "alcançou" nesta passada (vindo de cima ao cair,
  // ou de baixo ao subir). Assim um bloco em que o blob esteja EMBUTIDO (ex.: cresceu dentro, ou pilha
  // encostada) nunca ejeta o personagem pra cima — o bug do "teletransporte pra fora da tela".
  const preTop=blob.y, preBottom=blob.y+blob.h;
  blob.y+=dy;
  if(dy>0){                                        // caindo → pousa no topo MAIS ALTO dentre os que vinham de baixo dos pés
    let landY=null;
    for(const s of list) if(overlaps(blob,s) && preBottom<=s.y+2){ landY = (landY===null)?s.y:Math.min(landY,s.y); }
    if(landY!==null){ blob.y=landY-blob.h; blob.onGround=true; blob.vy=0; }
  } else if(dy<0){                                  // subindo → bate no teto mais baixo dentre os que vinham de cima da cabeça
    let ceilB=null;
    for(const s of list) if(overlaps(blob,s) && preTop>=s.y+s.h-2){ ceilB=(ceilB===null)?s.y+s.h:Math.max(ceilB,s.y+s.h); }
    if(ceilB!==null){ blob.y=ceilB; blob.vy=0; }
  } }

// Ao CRESCER (reabsorver/coletar), o blob fica mais largo e pode "inchar" pra dentro de uma
// parede ao lado — o que fazia ele atravessar/ser arremessado. Desencrava pelo lado mais curto.
function unstickWalls(){
  for(let it=0; it<6; it++){ let hit=null;
    for(const s of solidTiles){ if(overlaps(blob,s)){ hit=s; break; } }
    if(!hit) break;
    const outR=(hit.x+hit.w)-blob.x, outL=(blob.x+blob.w)-hit.x;
    blob.x = (outR<=outL) ? hit.x+hit.w : hit.x-blob.w;
    blob.vx=0;
  }
}

function inputState(){
  if(botOn) return { mx:bot.mx, left:bot.mx<-0.25, right:bot.mx>0.25, down:bot.down };
  let mx=0;
  if(IN.kb.left&&!IN.kb.right)mx=-1; else if(IN.kb.right&&!IN.kb.left)mx=1;
  else if(Math.abs(IN.joyX)>0.25)mx=IN.joyX;
  const down=IN.kb.down||IN.joyY>0.5;
  return { mx, left:mx<-0.25, right:mx>0.25, down };
}

// ===================== AUTOPILOT =====================
// Bot reativo: anda até a saída, pula abismos/espinhos, escala paredes,
// usa molas/carona, reabsorve massa e pressiona placas. Não é um solver
// perfeito de puzzle, mas resolve a travessia das fases pra você assistir.
function botSolidAt(px,py){
  for(const s of solidTiles) if(px>=s.x&&px<s.x+s.w&&py>=s.y&&py<s.y+s.h) return true;
  for(const g of globs) if(g.solid&&px>=g.x&&px<g.x+g.w&&py>=g.y&&py<g.y+g.h) return true;
  for(const c of crumbles) if(c.solid&&px>=c.x&&px<c.x+c.w&&py>=c.y&&py<c.y+c.h) return true;
  for(const m of movers) if(px>=m.x&&px<m.x+m.w&&py>=m.y&&py<m.y+m.h) return true;
  if(doors.length&&!plateOn()) for(const d of doors) if(px>=d.x&&px<d.x+d.w&&py>=d.y&&py<d.y+d.h) return true;
  return false;
}
function botSpikeAt(px,py){ for(const s of spikes) if(px>=s.x&&px<s.x+s.w&&py>=s.y-3&&py<s.y+s.h) return true; return false; }
// há chão (sem cair num espinho) até maxTiles abaixo da coluna px?
function botGroundBelow(px,fromY,maxTiles){
  for(let k=1;k<=maxTiles;k++){ const y=fromY+k*TILE;
    if(botSpikeAt(px,y)) return false; if(botSolidAt(px,y)) return true; }
  return false;
}
function botThink(dt){
  bot.jumpCD=Math.max(0,bot.jumpCD-dt);
  bot.mx=0; bot.down=false; bot.jump=false; bot.grab=false;
  const b=blob; if(!b||b.gone||!exitRect) return;
  const cx=b.x+b.w/2, cy=b.y+b.h/2, feet=b.y+b.h;
  const onG=b.onGroundPrev, wall=b.wallPrev||0, cling=b.cling;

  // --- ALVO: saída; mas antes, se há porta fechada, pressiona a placa ---
  let tx=exitRect.x+exitRect.w/2, ty=exitRect.y+exitRect.h/2, pressing=false, refuel=null;
  if(doors.length && plates.length && !plateOn()){
    let bp=null,bd=1e9; for(const p of plates){ const px=p.x+p.w/2, d=Math.abs(px-cx); if(d<bd){bd=d;bp=p;} }
    if(bp){ tx=bp.x+bp.w/2; ty=bp.y; pressing=true; }
  }
  // reabastece se a massa está baixa: mira o pedaço/gosma mais próximo (glob precisa PEGAR; 'o' coleta ao encostar)
  if(b.mass<=3){
    let btx=null,bty=null,bd=1e9,grabIt=false;
    for(const g of globs){ if(!g.solid)continue; const gx=g.x+g.w/2,gy=g.y+g.h, d=Math.hypot(gx-cx,gy-feet); if(d<bd){bd=d;btx=gx;bty=gy;grabIt=true;} }
    for(const pk of pickups){ const d=Math.hypot(pk.x-cx,pk.y-feet); if(d<bd){bd=d;btx=pk.x;bty=pk.y;grabIt=false;} }
    if(btx!==null && bd<TILE*7){ tx=btx; ty=bty; pressing=false; refuel={x:btx,y:bty,grab:grabIt}; }
  }

  const dx=tx-cx;
  let mx = dx>8?1:(dx<-8?-1:0);
  const dir = mx || (b.dir||1);

  // reabsorve ao chegar em cima do pedaço-alvo
  if(refuel && refuel.grab && Math.abs(refuel.x-cx)<TILE && Math.abs(feet-refuel.y)<TILE*1.6) bot.grab=true;
  // pressiona a placa: parado em cima dela, solta um pedaço (pulo) que fica sobre a placa
  if(pressing && Math.abs(tx-cx)<TILE*0.6 && onG && b.mass>1 && bot.jumpCD<=0){ bot.jump=true; bot.jumpCD=0.6; }

  // --- SENSORES à frente ---
  const aheadX = cx + dir*(b.w/2+10);
  const spikeAhead = botSpikeAt(aheadX,feet+2) || botSpikeAt(cx,feet+3);
  const gapAhead = onG && mx!==0 && !botGroundBelow(aheadX,feet-2,2);
  const wallAhead = botSolidAt(aheadX,cy) && !botSolidAt(aheadX,b.y-4);   // muro no corpo, teto livre → dá pra montar/escalar
  const stepUp  = botSolidAt(aheadX,feet-TILE*0.4) && !botSolidAt(aheadX,feet-TILE*1.5); // degrau/morro à frente
  const targetAbove = ty < feet - TILE*1.2;
  const targetBelow = ty > feet + TILE*2;

  if(onG){
    if(spikeAhead) bot.jump=true;
    else if(gapAhead && !targetBelow) bot.jump=true;    // abismo: pula — a menos que o alvo esteja lá EMBAIXO (deixa cair)
    else if(stepUp) bot.jump=true;                      // sobe degrau/morro
    else if(wallAhead) bot.jump=true;
    else if(targetAbove && !pressing){
      if(botSolidAt(cx,b.y-TILE*1.3) || botSolidAt(aheadX,b.y-TILE*0.4)) bot.jump=true;
    }
    if(bot.jump && (b.mass<=1 || bot.jumpCD>0)) bot.jump=false;
    else if(bot.jump) bot.jumpCD=0.4;
  }
  // ESCALAR: só quando está de fato grudado numa parede E o alvo está acima
  // (senão nunca dirige contra parede — evita subir/voar pra fora do mapa)
  if(cling && wall!==0 && targetAbove){ mx = wall>0?1:-1; bot.down=false; }

  // anti-travamento: parado demais no chão → pula pra tentar destravar
  if(onG){ if(Math.abs(cx-bot.lastX)<2) bot.antiStuck+=dt; else bot.antiStuck=0; bot.lastX=cx;
    if(bot.antiStuck>0.8 && bot.jumpCD<=0 && b.mass>1){ bot.jump=true; bot.jumpCD=0.5; bot.antiStuck=0; } }

  bot.mx=mx;
}
function toggleBot(on){ botOn = (on===undefined)?!botOn:!!on; botWait=0; bot.antiStuck=0;
  const bd=el("bot-badge"); if(bd) bd.classList.toggle("show",botOn);
  const bb=el("btn-bot"); if(bb) bb.classList.toggle("on",botOn); }

const MOVER_SLOW=0.35, MOVER_DWELL=0.6;   // plataformas mais lentas e que ESPERAM nas pontas (janela p/ pular do trampolim)
function updateMovers(dt){
  for(const m of movers){
    let s=Math.sin(levelTime*m.speed*MOVER_SLOW*Math.PI*2 + m.phase);       // oscilação base [-1,1]
    // DWELL: expoente <1 achata a curva perto de ±1 → a plataforma "descansa" nas pontas,
    // criando uma janela clara pra você saltar do trampolim e pousar nela.
    const sh = Math.sign(s)*Math.pow(Math.abs(s), MOVER_DWELL);
    const off = (sh*0.5+0.5)*m.dist;
    const nx=m.axis==="x"? m.x0+off : m.x0;
    const ny=m.axis==="y"? m.y0+off : m.y0;
    m.dx=nx-m.x; m.dy=ny-m.y; m.x=nx; m.y=ny;
  }
}
// bloqueio por PAREDE: impede o inimigo de atravessar tiles sólidos (bug corrigido).
function enemyBlocked(e,nx){
  const edge = nx>e.x ? nx+e.w : nx;                 // borda de ataque na direção do movimento
  const top=e.y+3, bot=e.y+e.h-3;
  for(const s of solidTiles){
    if(edge>s.x && edge<s.x+s.w && bot>s.y+2 && top<s.y+s.h-2) return true;
  }
  return false;
}
// o RETÂNGULO todo do inimigo na posição nx encostaria numa parede? (usado pela patrulha senoidal)
function enemyRectHitsWall(e,nx){
  const rx=nx+3, rw=e.w-6, ry=e.y+3, rh=e.h-6;
  for(const s of solidTiles){
    if(rx<s.x+s.w && rx+rw>s.x && ry<s.y+s.h && ry+rh>s.y) return true;
  }
  return false;
}
// ÁGUA: y da SUPERFÍCIE na coluna px (topo do tile d'água mais alto), ou null se não há água ali
function waterSurfaceY(px){ if(!water||!water.length)return null; const tx=Math.floor(px/TILE); let top=null;
  for(const r of water){ if((r.x/TILE|0)===tx){ const ty=r.y/TILE|0; if(top===null||ty<top)top=ty; } }
  return top===null?null:top*TILE; }
// GLOBS que BOIAM: um pedaço solto na água sobe e vira JANGADA na superfície.
// Robusto: sobe devagar, não empilha (jangadas se espalham em fileira) e NUNCA
// atravessa/ejeta o blob (apoia por baixo ou desliza pro lado).
function updateGlobsWater(dt){ if(!water||!water.length)return;
  // 1) empuxo suave até a superfície
  for(const g of globs){ const s=waterSurfaceY(g.x+g.w/2);
    if(s!=null && g.y+g.h>s+1){ g.inWater=true;
      const target=s-g.h*0.45+Math.sin(T*2.2+g.x*0.06)*1.6;                    // ~metade pra fora + bob
      g.vy=(g.vy||0)+((target-g.y)*9-(g.vy||0)*5)*dt; g.vy=Math.max(-70,Math.min(70,g.vy)); g.y+=g.vy*dt;
    } else { g.inWater=false; g.vy=0; } }
  // 2) jangadas que se sobrepõem se afastam (fileira, não pilha)
  for(let i=0;i<globs.length;i++){ const a=globs[i]; if(!a.inWater)continue;
    for(let j=i+1;j<globs.length;j++){ const c=globs[j]; if(!c.inWater)continue;
      const d=(a.x+a.w/2)-(c.x+c.w/2); if(Math.abs(d)<a.w-2 && Math.abs(a.y-c.y)<a.h*0.9){
        const push=((a.w-2)-Math.abs(d))*0.25, s2=d>=0?1:-1; a.x+=s2*push; c.x-=s2*push; } } }
  // 3) nunca sobrepor o blob: apoia por baixo, ou desliza pro lado
  for(const g of globs){ if(!g.inWater)continue;
    if(overlaps(blob,g)){ if(g.y+g.h*0.5 > blob.y+blob.h*0.55){ g.y=blob.y+blob.h; if(g.vy>0)g.vy=0; }
      else { const s2=(g.x+g.w/2<blob.x+blob.w/2)?-1:1; g.x=blob.x+(s2<0?-g.w:blob.w); } } }
}
// respingo ao entrar/bater na água
function splash(x,y,vy){ const n=Math.min(16,6+Math.abs(vy)/40);
  ring(x,y,18,"170,225,255",3.5,0.4); ring(x,y,10,"220,245,255",2.5,0.3);
  for(let i=0;i<n;i++){ const a=-Math.PI/2+(Math.random()*2-1)*1.0, s=60+Math.random()*Math.min(220,Math.abs(vy)*0.8);
    particles.push({x:x+(Math.random()*2-1)*8,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.3+Math.random()*0.3,max:0.6,r:1.4+Math.random()*2.4,color:"#bfeaff"}); }
  sfx("land"); }
// o blob está pisando num tile de GELO agora? (checa o piso logo abaixo dos pés)
function onIceUnder(){ if(!iceTiles||!iceTiles.length)return false; const fy=blob.y+blob.h;
  for(const t of iceTiles){ if(blob.x+blob.w>t.x+2 && blob.x<t.x+t.w-2 && Math.abs(fy-t.y)<4) return true; }
  return false; }
function updateEnemies(dt){
  const bx=blob?blob.x+blob.w/2:0, by=blob?blob.y+blob.h/2:0;
  for(const e of enemies){
    e.px=e.x;
    if(e.type==="patrol"){
      // PATRULHA: movimento SENOIDAL vai-e-vem (igual v8). Trava só se a posição-alvo bater
      // numa parede sólida (não atravessa mais); em chão aberto é o balanço original.
      const off=Math.sin(levelTime*e.speed*Math.PI*2)*(e.dist*0.5) + e.dist*0.5;
      const nx=e.x0+off;
      if(!enemyRectHitsWall(e,nx)) e.x=nx;   // em chão aberto isto é sempre verdade → movimento v8 puro
      e.y=e.y0;
    } else {
      // PERSEGUIDOR / CHEFE: caça o blob, mas é BARRADO por paredes.
      const boss=e.type==="boss";
      if(boss && levelTime<e.delay){                     // CHEFE acordando: te dá um respiro pra começar a correr
        e.y=e.y0+Math.sin(levelTime*7)*3; e.mad=0; e.alert=Math.min(1,levelTime/e.delay); e.dir=1; continue;
      }
      if(boss && !e.woke){ e.woke=true; sfx("boss"); shake=Math.max(shake,7); }   // RUGIDO ao acordar
      if(boss && e.hitT>0){                              // ATORDOADO após levar pulo na cabeça: recua e pisca
        e.hitT-=dt; const away=Math.sign((e.x+e.w/2)-bx)||1; const nx=e.x+away*150*dt; if(!enemyBlocked(e,nx))e.x=nx;
        e.y=e.y0+Math.sin(levelTime*22)*4; e.dir=away>0?1:-1; e.px=e.x; continue;
      }
      const dx=bx-(e.x+e.w/2), d=Math.hypot(dx, by-(e.y+e.h/2));
      const phase = boss ? (1+(3-(e.hp||3))*0.3) : 1;    // FASE: mais rápido a cada dano (HP 3→2→1)
      if(boss && e.mode==='wind'){                        // ── TELEGRAFA o SALTO-PANCADA (agacha, pisca, treme)
        e.windT-=dt; e.tel=1; shake=Math.max(shake,3);
        if(Math.random()<0.5) burst(e.x+e.w/2,e.y+e.h,2,"#ff4d7e",90);
        if(e.windT<=0){ e.mode='leap'; e.vy=-680; e.vx=Math.max(-300,Math.min(300,dx*1.8)); sfx("jump"); }
      } else if(boss && e.mode==='leap'){                 // ── SALTO em ARCO na direção do jogador
        e.vy+=1600*dt; e.y+=e.vy*dt; const nx=e.x+e.vx*dt; if(!enemyBlocked(e,nx)) e.x=nx;
        if(e.y>=e.y0){ e.y=e.y0; e.mode='chase'; e.tel=0; bossSlam(e); }   // PANCADA no chão ao aterrissar
      } else {                                            // ── CAÇA + CUSPE (padrão)
        e.tel=0;
        const range=boss?1e9:e.range;
        if(d<range){
          const step=Math.sign(dx)*e.speed*(boss?120*phase:98)*dt;
          const nx=e.x+step; if(!enemyBlocked(e,nx)) e.x=nx;
          e.mad=Math.min(1,e.mad+dt*3); e.alert=1;
          if(boss && Math.random()<0.5) burst(e.x+e.w*(dx>0?0:1),e.y+e.h*0.6,1,"#c04a8a",40);
        } else {
          const hx=e.x0-e.x;
          if(Math.abs(hx)>1){ const nx=e.x+Math.sign(hx)*Math.min(Math.abs(hx),e.speed*70*dt); if(!enemyBlocked(e,nx)) e.x=nx; }
          e.mad=Math.max(0,e.mad-dt*1.6); e.alert=Math.max(0,e.alert-dt);
        }
        e.y = e.y0 + Math.sin(levelTime*(4+e.mad*4))*(2+e.mad*2)*(boss?1.6:1);
        if(boss){
          e.leapCD=(e.leapCD==null?4.0:e.leapCD)-dt;                        // agenda o SALTO-PANCADA
          if(e.leapCD<=0 && Math.abs(dx)<600){ e.mode='wind'; e.windT=0.5; e.leapCD=5.5-(3-(e.hp||3))*0.9; }
          else {                                                           // senão, CUSPE gosma em arco
            e.windup=Math.max(0,(e.windup||0)-dt); e.shootT=(e.shootT||2.2)-dt;
            if(e.shootT<=0){ e.shootT=2.6-(3-(e.hp||3))*0.55; e.windup=0.45; }
            if(e.windup>0 && e.windup<=dt+0.001){ const n=1+(3-(e.hp||3)); for(let k=0;k<n;k++) bossShoot(e,(k-(n-1)/2)*90); }
          }
        }
      }
      if(boss) shake=Math.max(shake, Math.max(0, (1-d/360))*3*phase);   // treme quando o chefe se aproxima
    }
    e.dir = e.x>e.px?1:(e.x<e.px?-1:(e.dir||1));
  }
}
function fitCanvas(){
  const stage=el("stage"); if(!stage) return;
  const cw=stage.clientWidth||640, ch=stage.clientHeight||384;
  const dpr=Math.min(2, window.devicePixelRatio||1);
  canvas.width=Math.max(1,Math.round(cw*dpr));
  canvas.height=Math.max(1,Math.round(ch*dpr));
  const portrait = cw<560;
  const targetTiles = portrait ? 12 : 17;        // celular: ~12 tiles (zoom in, personagem grande)
  zoom = canvas.width/(targetTiles*TILE);
  camViewW = canvas.width/zoom; camViewH = canvas.height/zoom;
  // faixa inferior reservada aos controles (pra o personagem NUNCA ficar atrás deles)
  camSafeBottom = (canvas.height * (portrait?0.26:0.10)) / zoom;
}
function camFollow(snap){
  const worldW=COLS*TILE, worldH=ROWS*TILE;
  const usableH = camViewH - camSafeBottom;      // altura útil ACIMA dos controles
  // LOOK-AHEAD: a câmera antecipa na direção do movimento (revela o que vem à frente)
  const dir = blob.vx>40?1:(blob.vx<-40?-1:0);
  const lookTarget = dir*LOOKAHEAD*Math.min(1,Math.abs(blob.vx)/MOVE);
  cam.look = snap ? lookTarget : cam.look + (lookTarget-cam.look)*0.05;
  let tx = worldW<=camViewW ? (worldW-camViewW)/2 : Math.max(0,Math.min(blob.x+blob.w/2 + cam.look - camViewW/2, worldW-camViewW));
  // centraliza o blob na área útil; permite "overscroll" p/ baixo (até camSafeBottom) pra erguer o chão acima dos controles
  const maxTy = worldH - camViewH + camSafeBottom;
  let ty = worldH<=usableH ? (worldH-usableH)/2 : Math.max(0, Math.min(blob.y+blob.h/2 - usableH*0.52, maxTy));
  if(snap){ cam.x=tx; cam.y=ty; } else { cam.x+=(tx-cam.x)*0.14; cam.y+=(ty-cam.y)*0.11; }
}

function update(dt){
  T+=dt;
  if(state!=="play"){ jumpEdge=grabEdge=false; return; }
  if(hitStop>0){ hitStop-=dt; return; }              // HIT-STOP: congela o mundo por instantes no impacto
  levelTime+=dt;
  if(blob.flash>0)blob.flash-=dt; if(blob.clingLock>0)blob.clingLock-=dt; if(blob.hurtT>0)blob.hurtT-=dt;
  blob.blink-=dt; if(blob.blink<-0.15)blob.blink=1.6+Math.random()*2.5;

  if(transition>0) transition=Math.max(0,transition-dt*2.6);
  updateMovers(dt); updateEnemies(dt);
  // carona: se estava sobre um mover, acompanha o deslocamento dele
  if(blob.onGroundPrev && blob.rideMover){ blob.x+=blob.rideMover.dx; blob.y+=blob.rideMover.dy; }

  if(botOn){ botThink(dt); if(bot.jump) jumpEdge=true; if(bot.grab) grabEdge=true;   // AUTOPILOT dirige
    const d=exitRect?Math.hypot(exitRect.x-blob.x, exitRect.y-blob.y):0;             // mede progresso rumo à saída
    if(bot.bestD==null || d<bot.bestD-3){ bot.bestD=d; bot.progT=0; } else bot.progT+=dt; }
  const {mx,left,right,down}=inputState();
  const onG=blob.onGroundPrev, wall=blob.wallPrev||0;

  let cling=false;
  if(!onG && wall!==0 && blob.clingLock<=0){ if((wall>0&&right)||(wall<0&&left)) cling=true; }
  blob.cling=cling;

  const onIce=blob.onIcePrev;                          // pisando no GELO no frame anterior?
  const ctrl=onG?1:AIR;
  if(cling) blob.vx=0;
  else if(onIce){                                      // GELO: pouca aderência — acelera devagar e DESLIZA
    if(Math.abs(mx)>0.25) blob.vx += (mx*MOVE - blob.vx)*0.05;
    else blob.vx *= 0.99;
  }
  else if(Math.abs(mx)>0.25) blob.vx=mx*MOVE*ctrl;
  else blob.vx*= onG?0.6:0.92;

  // ÁGUA (Mundo 2): FLUTUAÇÃO POR MASSA — leve boia, pesado afunda — + arrasto pastoso. Só onde há água.
  const surfY = (water&&water.length)? waterSurfaceY(blob.x+blob.w/2) : null;
  const inW = surfY!=null && (blob.y+blob.h) > surfY+2;
  if(!blob._wasInW && inW && Math.abs(blob.vy)>120) splash(blob.x+blob.w/2, surfY, blob.vy);   // respingo ao entrar
  blob._wasInW=inW; blob._inWater=inW;
  if(cling){ blob.vy = down?CLIMB:-CLIMB; }
  else if(inW){
    const sub=Math.max(0,Math.min(1,(blob.y+blob.h-surfY)/blob.h));         // fração submersa
    const light=Math.max(0,Math.min(1,(5.5-blob.mass)/4.5));                // massa<=1 boia forte; >=5.5 afunda
    let buoy=1500*light*sub; if(down) buoy*=0.30;                           // segurar ↓ mergulha
    blob.vy += (GRAVITY*0.25 - buoy)*dt;                                    // gravidade reduzida - empuxo
    blob.vy*=0.90; blob.vx*=0.88;                                           // arrasto da água
    blob.vy=Math.max(-260, Math.min(MAX_FALL*0.4, blob.vy));
    blob.boosted=true; blob.apexY=blob.y;                                   // sem punição de queda dentro d'água
  }
  else { blob.vy+=GRAVITY*dt; if(blob.vy>MAX_FALL)blob.vy=MAX_FALL; }

  // JUMP BUFFER: registra a intenção de pulo por uma janelinha (perdoa apertar cedo demais)
  if(jumpEdge){ hideHint(); blob.jumpBuf=JUMPBUF; }
  // COYOTE TIME: dá pra pular por um instante mesmo após sair da borda
  const canJump = onG || cling || (blob.coyote||0)>0 || inW;    // dentro d'água dá pra "nadar" (soltar massa e subir)
  if((blob.jumpBuf||0)>0 && canJump && blob.mass>1){
    dropGlob(cling?wall:0); blob.mass-=1; sizeBlob();
    blob.vy=-(inW?JUMP_V*0.6:JUMP_V); if(cling){blob.vx=-wall*MOVE*0.9;blob.clingLock=0.18;}
    burst(blob.x+blob.w/2,blob.y+blob.h,7,"#7ee06b",130);
    ring(blob.x+blob.w/2,blob.y+blob.h,blob.w*0.95,cling?"120,230,220":"126,224,107",3,0.34);  // impulso do salto
    sfx("jump"); renderHud(); blob.jumpBuf=0; blob.coyote=0;
  } else if(jumpEdge && canJump && blob.mass<=1){ blob.flash=0.2; sfx("nope"); blob.jumpBuf=0; }
  if((blob.jumpBuf||0)>0) blob.jumpBuf=Math.max(0,blob.jumpBuf-dt);
  jumpEdge=false;
  if(grabEdge){ reabsorb(); grabEdge=false; }
  if(Math.abs(mx)>0.3) hideHint();

  updateGlobsWater(dt);                 // jangadas: pedaços boiam na superfície ANTES da colisão do blob
  const preVy=blob.vy, preG=blob.onGroundPrev;
  blob.onGround=false; blob.wall=0;
  moveAxis(blob.vx*dt, blob.vy*dt);
  if(blob.onGround){
    if(!preG&&preVy>260){ const fx=blob.x+blob.w/2, fy=blob.y+blob.h;
      const fallDist=(blob.apexY!=null)? (blob.y-blob.apexY) : 0;   // altura real da descida (do ápice até aqui)
      blob._lastFall=Math.round(fallDist); blob._lastVy=Math.round(preVy);
      // QUEDA ALTA (alto mesmo): baque forte + perde 1 geleca (fica um pedaço no chão).
      // EXCEÇÃO: quedas após mola/trampolim (boosted) ou pouso em superfície elástica NÃO punem.
      if(fallDist>250 && preVy>560 && blob.mass>1 && !blob.boosted && !feetOnBouncy()){
        dropGlob(0); blob.mass-=1; sizeBlob();
        splat(fx,fy,16,240); burst(fx,fy,6,"#5fbf6a",120);
        ring(fx,fy,blob.w*2.4,"120,220,120",4.5,0.5); ring(fx,fy,blob.w*1.5,"210,255,190",3,0.4);  // baque forte
        shake=10; hitstop(0.06); sfx("impact"); renderHud();
      } else { burst(fx,fy,5,"#5fbf6a",95); shake=Math.min(6,preVy/120);
        if(preVy>360) ring(fx,fy,blob.w*1.15,"126,224,107",2.5,0.3);   // poeira do pouso
        if(preVy>420)sfx("land"); }
    }
    blob.apexY=blob.y; blob.boosted=false;                 // no chão: zera ápice e o impulso
  } else {
    blob.apexY = (blob.apexY==null)? blob.y : Math.min(blob.apexY, blob.y);   // no ar: guarda o ponto mais alto
  }
  // coyote time: recarrega no chão, escoa no ar
  if(blob.onGround) blob.coyote=COYOTE; else if((blob.coyote||0)>0) blob.coyote=Math.max(0,blob.coyote-dt);
  blob.onGroundPrev=blob.onGround; blob.wallPrev=blob.wall;
  blob.onIcePrev = blob.onGround && onIceUnder();      // ficou em cima de gelo?

  // qual mover está pisando (pra carona no próximo frame)
  blob.rideMover=null;
  if(blob.onGround) for(const m of movers){
    if(blob.x+blob.w>m.x+2 && blob.x<m.x+m.w-2 && Math.abs((blob.y+blob.h)-m.y)<3){ blob.rideMover=m; break; }
  }
  // mola: impulso pra cima sem gastar massa
  if(blob.onGround && blob.vy>=0) for(const sp of springs){
    if(blob.x+blob.w>sp.x+3 && blob.x<sp.x+sp.w-3 && Math.abs((blob.y+blob.h)-sp.y)<5){
      blob.vy=-BOUNCE; blob.onGround=false; blob.onGroundPrev=false; sp.sq=1; blob.boosted=true; // impulso: sem punição de queda
      burst(sp.x+sp.w/2,sp.y,8,"#9fe8ff",160); ring(sp.x+sp.w/2,sp.y,sp.w*1.3,"159,232,255",3.5,0.4); sfx("spring"); break;
    }
  }
  for(const sp of springs) if(sp.sq>0) sp.sq=Math.max(0,sp.sq-dt*4);

  // SEGREDO 2x2: 4 gelecas encostadas formam TRAMPOLIM — quica ao pisar em cima (sem gastar massa)
  detectTrampolines();
  if(blob.onGround && blob.vy>=0) for(const tp of tramp){
    if(blob.x+blob.w>tp.x+4 && blob.x<tp.x+tp.w-4 && Math.abs((blob.y+blob.h)-tp.y)<6){
      blob.vy=-BOUNCE*1.12; blob.onGround=false; blob.onGroundPrev=false; tp.sq=1; blob.boosted=true; // trampolim: sem punição de queda
      burst(tp.x+tp.w/2,tp.y,12,"#8be9ff",180); sfx("spring"); break;
    }
  }
  for(const tp of tramp) if(tp.sq>0) tp.sq=Math.max(0,tp.sq-dt*4);

  // plataformas que DESMORONAM: pisou → treme e cai; depois respawna
  for(const c of crumbles){
    if(c.solid){
      const on = blob.onGround && blob.x+blob.w>c.x+2 && blob.x<c.x+c.w-2 && Math.abs((blob.y+blob.h)-c.y)<3;
      if(on){ c.t+=dt; if(c.t>=0.55){ c.solid=false; c.resp=2.6; burst(c.x+c.w/2,c.y+c.h/2,8,"#b98a5a",80); sfx("nope"); } }
      else if(c.t>0) c.t=Math.max(0,c.t-dt*2);
    } else { c.resp-=dt; if(c.resp<=0){ c.solid=true; c.t=0; } }
  }

  camFollow(false);   // câmera segue o blob

  // inimigos: contato = morte (exceto o CHEFE, que se combate PULANDO na cabeça)
  for(const e of enemies){
    if(e.type==="boss"){ handleBoss(e,dt); if(state!=="play")return; continue; }
    const ix=e.w*0.16, iy=e.h*0.16;
    if(overlaps(blob,{x:e.x+ix,y:e.y+iy,w:e.w-ix*2,h:e.h-iy*2})){ die(); return; } }
  // paredes FANTASMA: parecem sólidas até você ENTRAR nelas — aí somem (revelam o esconderijo)
  for(const fk of fakes){ if(fk.rev<1 && overlaps(blob,fk)) fk.rev=Math.min(1,fk.rev+dt*5); }
  // gemas INVISÍVEIS (estilo Fez): só materializam quando você já está bem em cima do esconderijo
  const bcx=blob.x+blob.w/2, bcy=blob.y+blob.h/2;
  for(const gm of gems){ if(gm.got)continue;
    if(Math.hypot(bcx-gm.x,bcy-gm.y)<GEM_REVEAL+blob.w*0.4) gm.rev=Math.min(1,gm.rev+dt*5); }

  // estrelas VISÍVEIS (coletável comum)
  for(const st of stars) if(!st.got && overlaps(blob,{x:st.x-st.r,y:st.y-st.r,w:st.r*2,h:st.r*2})){
    st.got=true; burst(st.x,st.y,14,"#ffd24a",150); sfx("star"); shake=Math.max(shake,2);
  }
  // gemas = SEGREDOS ocultos (nunca anunciados; o jogo NÃO avisa que existem)
  for(const gm of gems) if(!gm.got && overlaps(blob,{x:gm.x-gm.r,y:gm.y-gm.r,w:gm.r*2,h:gm.r*2})){
    gm.got=true; burst(gm.x,gm.y,20,"#c9a6ff",180); sfx("secret"); shake=Math.max(shake,4);
    showHint("✨ segredo…");
  }

  // calor
  let inHeat=false; for(const h of heatZones)if(overlaps(blob,h)){inHeat=true;break;}
  blob.melting=inHeat;
  if(inHeat){ blob.meltAcc+=dt; if(blob.meltAcc>=MELT_TIME){ blob.meltAcc-=MELT_TIME;
      burst(blob.x+blob.w/2,blob.y,4,"#ff9a4a",60);
      if(blob.mass>1){ blob.mass--; sizeBlob(); renderHud(); sfx("melt"); } else { die(); return; } } }
  else if(blob.meltAcc>0) blob.meltAcc=Math.max(0,blob.meltAcc-dt*0.5);

  // ESCALAR PAREDE também gasta massa (custo, tipo o calor) — grudar/subir não é mais de graça
  if(blob.cling){ blob.climbAcc=(blob.climbAcc||0)+dt;
    if(blob.climbAcc>=CLIMB_MELT){ blob.climbAcc-=CLIMB_MELT;
      burst(blob.x+blob.w/2,blob.y+blob.h,4,"#9fe0d0",70);
      if(blob.mass>1){ blob.mass--; sizeBlob(); renderHud(); sfx("melt"); } else { die(); return; } } }
  else if(blob.climbAcc>0) blob.climbAcc=Math.max(0,blob.climbAcc-dt*0.6);

  updateParticles(dt); updateRings(dt); updateTrail(dt); updateShots(dt);
  // RASTRO de slime: ao andar no chão, escalar/deslizar na parede, ou voar — mostra que é gosma.
  const moving = Math.abs(blob.vx)>60 || (blob.cling && Math.abs(blob.vy)>40) || (!blob.onGround && Math.abs(blob.vy)>320);
  if(!blob.gone && moving){ blob._trailAcc=(blob._trailAcc||0)+dt; if(blob._trailAcc>=0.028){ blob._trailAcc=0; pushTrail(); } }
  if(shake>0) shake=Math.max(0,shake-dt*24);
  // um pedaço só vira SÓLIDO quando não está sobreposto ao jogador — senão a colisão
  // "ejetaria" o blob pra cima (teletransporte de ~1 geleca). Espera o blob sair de cima.
  const now=performance.now(); for(const g of globs)if(!g.solid&&now>=g.solidAt&&!overlaps(blob,g))g.solid=true;

  for(let i=pickups.length-1;i>=0;i--){ const p=pickups[i];
    if(overlaps(blob,{x:p.x-p.r,y:p.y-p.r,w:p.r*2,h:p.r*2})){
      if(blob.mass<level.max){blob.mass++;sizeBlob();unstickWalls();}
      burst(p.x,p.y,9,"#a6f08a",110); sfx("pickup"); pickups.splice(i,1); renderHud(); } }

  for(const s of spikes)if(overlaps(blob,{x:s.x+4,y:s.y+7,w:s.w-8,h:s.h-7})){ die(); return; }
  if(blob.y>ROWS*TILE+80){ die(); return; }
  // MURALHA DEVORADORA: avança pra direita; se te alcançar, você é ENGOLIDO
  if(devourEdge!=null){
    devourSpeed += (level.devourer.accel||0)*dt;
    devourEdge += devourSpeed*dt;
    const gap=(blob.x+blob.w*0.45)-devourEdge;                       // folga entre você e a boca da muralha
    devourWarn = gap<TILE*3 ? 1 : Math.max(0,devourWarn-dt*2);       // pisca de perigo quando ela chega perto
    if(devourWarn>0) shake=Math.max(shake, (1-gap/(TILE*3))*4);      // treme quando ela cola em você
    if(gap<0){ devoured(); return; }                                 // engolido
  }
  if(overlaps(blob,exitRect)) win();
}

// pés sobre uma superfície elástica (mola ou trampolim)? — usado pra não punir queda nelas
function feetOnBouncy(){
  const feet=blob.y+blob.h;
  for(const sp of springs){ if(blob.x+blob.w>sp.x+3 && blob.x<sp.x+sp.w-3 && Math.abs(feet-sp.y)<6) return true; }
  for(const tp of tramp){ if(blob.x+blob.w>tp.x+4 && blob.x<tp.x+tp.w-4 && Math.abs(feet-tp.y)<8) return true; }
  return false;
}
function dropGlob(wallSide){
  const now=performance.now();
  const g={x:blob.x+blob.w/2-GLOB/2,y:blob.y+blob.h-GLOB,w:GLOB,h:GLOB,solid:false,solidAt:now+160,born:now,wall:wallSide,tramp:false};
  if(wallSide>0)g.x=blob.x+blob.w-GLOB; else if(wallSide<0)g.x=blob.x;
  globs.push(g);
  slimeSplit(g.x+g.w/2, g.y+g.h*0.35);           // gosma esguicha: um PEDAÇO se desprendeu
}

// SEGREDO — TRAMPOLIM 2x2: 4 gelecas sólidas formando um quadrado FIRME (encostadas e alinhadas).
// Exige espaçamento real de ~GLOB com tolerância apertada, pra NÃO formar trampolim por acidente
// quando pedaços soltos se amontoam (senão o jogador "dá um pulo gigante" sem querer ao coletar).
function detectTrampolines(){
  tramp=[];
  const solid=[]; for(const g of globs){ g.tramp=false; if(g.solid) solid.push(g); }
  if(solid.length<4) return;
  const TOL=8;                                   // alinhamento firme: acidente não vira trampolim
  const near=(v,t)=>Math.abs(v-t)<TOL;
  for(const a of solid){
    if(a.tramp) continue;                        // canto superior-esquerdo
    const b=solid.find(g=>!g.tramp && g!==a && near(g.x,a.x+GLOB) && near(g.y,a.y));         // direita
    const c=solid.find(g=>!g.tramp && g!==a && near(g.x,a.x)      && near(g.y,a.y+GLOB));    // abaixo
    const d=(b&&c)?solid.find(g=>!g.tramp && g!==a&&g!==b&&g!==c && near(g.x,a.x+GLOB) && near(g.y,a.y+GLOB)):null; // diagonal
    if(b&&c&&d){
      a.tramp=b.tramp=c.tramp=d.tramp=true;
      const left=Math.min(a.x,c.x), right=Math.max(b.x,d.x)+GLOB, topY=Math.min(a.y,b.y);
      tramp.push({x:left, y:topY, w:right-left, sq:0});
    }
  }
}

// SEGREDO — TROCAR DE CORPO: toque numa geleca solta e ela vira VOCÊ; onde você estava fica uma geleca.
function tryPossess(clientX,clientY){
  if(state!=="play"||!blob) return false;
  const rect=canvas.getBoundingClientRect();
  const cx=(clientX-rect.left)*(canvas.width/rect.width), cy=(clientY-rect.top)*(canvas.height/rect.height);
  return possessWorld(cx/zoom+cam.x, cy/zoom+cam.y);
}
function possessWorld(wx,wy){
  if(state!=="play"||!blob) return false;
  const pad=10;
  let hit=-1;
  for(let i=0;i<globs.length;i++){ const g=globs[i]; if(!g.solid)continue;
    if(wx>=g.x-pad && wx<=g.x+g.w+pad && wy>=g.y-pad && wy<=g.y+g.h+pad){ hit=i; break; } }
  if(hit<0) return false;
  const g=globs[hit];
  const oldGlob={x:blob.x+blob.w/2-GLOB/2, y:blob.y+blob.h-GLOB, w:GLOB,h:GLOB, solid:true, solidAt:0, wall:0, tramp:false};
  burst(blob.x+blob.w/2,blob.y+blob.h/2,10,"#8be9ff",120);
  blob.x=g.x+g.w/2-blob.w/2; blob.y=g.y+g.h-blob.h; blob.vx=0; blob.vy=0;
  blob.onGround=false; blob.onGroundPrev=false; blob.cling=false;
  globs.splice(hit,1); globs.push(oldGlob);
  resolvePlace();
  burst(blob.x+blob.w/2,blob.y+blob.h/2,16,"#8be9ff",170); sfx("swap");
  return true;
}
function resolvePlace(){ const list=solidsList();
  for(let it=0; it<20; it++){ let ov=0, s2=null;
    for(const s of list){ if(overlaps(blob,s)){ const o=(blob.y+blob.h)-s.y; if(o>ov){ov=o;s2=s;} } }
    if(!s2) break; blob.y=s2.y-blob.h-0.5; }
}
function reabsorb(){ if(blob.mass>=level.max)return;
  const inW=!!(water&&water.length);                   // fase com água: alcance generoso por DISTÂNCIA (jangadas boiam em volta)
  const bx=blob.x+blob.w/2, by=blob.y+blob.h/2;
  let best=-1,bd=1e9;
  for(let i=0;i<globs.length;i++){ const g=globs[i];
    if(inW){ if(!(g.inWater||g.solid))continue; }       // na água: jangada boiando ou sólida
    else if(!g.solid) continue;
    const gx=g.x+g.w/2, gy=g.y+g.h/2, dx=gx-bx, dy=gy-by, d2=dx*dx+dy*dy;
    let hit;
    if(inW){ const reach=blob.w/2+g.w/2+REABSORB_R+12; hit=d2<reach*reach; }
    else { const R=REABSORB_R; hit=overlaps({x:blob.x-R,y:blob.y-R,w:blob.w+R*2,h:blob.h+R*2}, g); }
    if(hit && d2<bd){ bd=d2; best=i; } }
  if(best>=0){ const g=globs[best]; const gx=g.x+g.w/2, gy=g.y+g.h/2, bx=blob.x+blob.w/2, by=blob.y+blob.h/2;
    // partículas SENDO PUXADAS do pedaço PRA DENTRO do jogador (convergem)
    for(let k=0;k<10;k++){ const t=Math.random(), px=gx+(Math.random()*2-1)*8, py=gy+(Math.random()*2-1)*8;
      particles.push({x:px,y:py,vx:(bx-px)*3.2,vy:(by-py)*3.2,life:0.2+Math.random()*0.12,max:0.34,r:1.6+Math.random()*2,color:"#a6f08a"}); }
    ring(gx,gy,g.w*1.5,"166,240,138",3,0.34,true);        // anel colapsando = absorção
    sfx("absorb");
    globs.splice(best,1); blob.mass++; sizeBlob(); unstickWalls(); blob.flash=0.12; renderHud(); } }

// LUTA DO CHEFE: pular na CABEÇA dá dano; encostar de lado tira massa (não mata na hora).
function handleBoss(e,dt){
  if(e.hp===undefined) e.hp=3;
  if(e.hitT>0) return;                                  // i-frames do chefe (recuando)
  const box={x:e.x+e.w*0.12,y:e.y+e.h*0.08,w:e.w*0.76,h:e.h*0.84};
  if(!overlaps(blob,box)) return;
  const feet=blob.y+blob.h, headLine=e.y+e.h*0.5;
  if(blob.vy>40 && feet < headLine){                    // PULO NA CABEÇA = dano
    e.hp--; e.hitT=1.0; e.mode='chase'; e.vy=0; e.tel=0; e.y=e.y0;   // interrompe salto/telegrafo ao levar dano
    blob.vy=-BOUNCE*0.7; blob.onGround=false; blob.onGroundPrev=false;   // quica pra cima
    burst(e.x+e.w/2, e.y, 20, "#ff8fae", 220); ring(e.x+e.w/2, e.y, e.w*1.4, "255,143,174", 4, 0.45); shake=9; hitstop(0.09); sfx("bosshit");
    if(e.hp<=0) bossDefeated(e);
    return;
  }
  // senão: DANO no jogador — perde massa + empurrão + piscada de invencibilidade
  if(blob.hurtT>0) return;
  blob.hurtT=1.2; const kb=(blob.x+blob.w/2 < e.x+e.w/2)?-1:1;
  blob.vx=kb*340; blob.vy=-280; blob.onGround=false; blob.onGroundPrev=false; blob.flash=0.5;
  blob.mass=Math.max(0, blob.mass-2); sizeBlob(); renderHud();
  burst(blob.x+blob.w/2,blob.y+blob.h/2,12,"#ff6a6a",190); shake=8; sfx("hurt");
  if(blob.mass<1){ die(); }
}
function bossDefeated(e){
  for(let i=0;i<48;i++) burst(e.x+e.w/2,e.y+e.h/2,1,CONFCOL[i%CONFCOL.length],260);
  const idx=enemies.indexOf(e); if(idx>=0) enemies.splice(idx,1);
  shots=[]; shake=14; sfx("win"); win();                // dispara o final especial da fase secreta
}
// SALTO-PANCADA: onda de choque pelo chão ao aterrissar. Quem está no chão perto leva dano; pular ESCAPA.
function bossSlam(e){
  const cx=e.x+e.w/2, gy=e.y+e.h;
  shake=13; hitstop(0.10); sfx("impact");
  splat(cx,gy,16,180); ring(cx,gy,e.w*1.1,"255,143,174",5,0.42); ring(cx,gy,e.w*2.0,"255,120,150",3,0.5);
  for(let i=0;i<22;i++){ const a=Math.PI+Math.random()*Math.PI, sp=120+Math.random()*180;   // detritos rasteiros
    particles.push({x:cx,y:gy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*0.5,life:0.3+Math.random()*0.25,max:0.55,r:2+Math.random()*3,color:"#ff8fae"}); }
  if(blob && !blob.gone && blob.hurtT<=0){
    const grounded=blob.onGroundPrev||blob.onGround, near=Math.abs((blob.x+blob.w/2)-cx)<e.w*2.4;
    if(grounded && near){                                // no chão e no alcance da onda = leva a pancada
      blob.hurtT=1.2; const kb=(blob.x+blob.w/2<cx)?-1:1;
      blob.vx=kb*360; blob.vy=-260; blob.onGround=false; blob.onGroundPrev=false; blob.flash=0.5;
      blob.mass=Math.max(0,blob.mass-2); sizeBlob(); renderHud();
      burst(blob.x+blob.w/2,blob.y+blob.h/2,12,"#ff6a6a",190); sfx("hurt");
      if(blob.mass<1){ die(); }
    }
  }
}
// CHEFE cuspe gosma em ARCO no jogador (dodge ou perde massa)
function bossShoot(e, spread){
  const sx=e.x+e.w/2, sy=e.y+e.h*0.28, tx=(blob?blob.x+blob.w/2:sx), ty=(blob?blob.y+blob.h/2:sy);
  const dx=tx-sx, t=Math.max(0.55, Math.min(1.15, Math.abs(dx)/380));
  shots.push({x:sx,y:sy, vx:dx/t+(spread||0), vy:(ty-sy)/t - 0.5*1000*t, r:10, life:3.0});
  burst(sx,sy,7,"#d24a9a",130); sfx("spit");
}
function updateShots(dt){
  for(let i=shots.length-1;i>=0;i--){ const s=shots[i];
    s.vy+=1000*dt; s.x+=s.vx*dt; s.y+=s.vy*dt; s.life-=dt;
    if(s.life<=0 || s.y>ROWS*TILE+40){ shots.splice(i,1); continue; }
    if(isSolidAt(s.x,s.y)){ splat(s.x,s.y,7,150); ring(s.x,s.y,20,"210,90,160",2.5,0.3); shots.splice(i,1); continue; }
    if(blob && !blob.gone && blob.hurtT<=0 && overlaps(blob,{x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2})){
      blob.hurtT=1.0; const kb=Math.sign(s.vx)||1; blob.vx=kb*280; blob.vy=-230; blob.flash=0.5; blob.onGround=false; blob.onGroundPrev=false;
      blob.mass=Math.max(0,blob.mass-1); sizeBlob(); renderHud();
      splat(s.x,s.y,6,150); burst(blob.x+blob.w/2,blob.y+blob.h/2,10,"#ff6a6a",170); shake=7; sfx("hurt");
      shots.splice(i,1); if(blob.mass<1){ die(); return; }
    }
  }
}

function die(){ if(state==="dead")return; deaths++;
  const cx=blob.x+blob.w/2, cy=blob.y+blob.h/2;
  splat(cx,cy,30,320); burst(cx,cy,10,"#ff7a6a",200);           // slime se ESPATIFA
  ring(cx,cy,blob.w*2.6,"255,140,120",4,0.5); ring(cx,cy,blob.w*1.6,"255,220,200",2.5,0.4);
  blob.gone=true;                                                // a geleca some (virou respingo)
  sfx("impact"); sfx("die"); shake=12;
  state="dead";
  // deixa o espatifo aparecer antes de mostrar a tela de morte
  const backBtn = customCtx==='edit' ? {t:"Editor",ghost:true,cb:()=>showEditor(false)}
                : customCtx==='list' ? {t:"Minhas Fases",ghost:true,cb:showCustom}
                : {t:"Menu",ghost:true,cb:showMenu};
  deferWin(()=>overlay("💥 Ai!","Espinho, queda ou derreteu.",[
    {t:"Tentar de novo",cb:resetLevel}, backBtn]), 0.5); }

// morte por ser ENGOLIDO pela muralha devoradora — a geleca é sugada pra dentro da gosma
function devoured(){ if(state==="dead")return; deaths++;
  const cx=blob.x+blob.w/2, cy=blob.y+blob.h/2;
  for(let i=0;i<26;i++) particles.push({x:cx+(Math.random()*2-1)*blob.w,y:cy+(Math.random()*2-1)*blob.h,
    vx:-160-Math.random()*160, vy:(Math.random()*2-1)*90, life:0.3+Math.random()*0.25,max:0.55,r:2+Math.random()*3,color:"#c46ad0"});
  ring(cx,cy,blob.w*2.4,"180,90,220",4,0.5); blob.gone=true;
  sfx("die"); shake=13; state="dead";
  const backBtn = customCtx==='edit' ? {t:"Editor",ghost:true,cb:()=>showEditor(false)}
                : customCtx==='list' ? {t:"Minhas Fases",ghost:true,cb:showCustom}
                : {t:"Menu",ghost:true,cb:showMenu};
  deferWin(()=>overlay("🫠 Devorado!","A Gosma-Mãe te engoliu. Não pare de subir!",[
    {t:"Tentar de novo",cb:resetLevel}, backBtn]), 0.5); }

function win(){ state="complete"; sfx("win"); burst(exitRect.x+exitRect.w/2,exitRect.y+exitRect.h/2,22,"#7ee06b",190);
  // FASE CUSTOM: sem progresso salvo — só confirma que funciona e volta ao editor/lista
  if(customCtx){ ring(exitRect.x+exitRect.w/2,exitRect.y+exitRect.h/2,60,"126,224,107",4,0.5);
    deferWin(()=>overlay("✅ Fase concluída!","Sua fase é jogável! 🎉",[
      {t:"Editor",cb:()=>showEditor(false)},
      {t:"Minhas Fases",ghost:true,cb:showCustom}]), 0.5); return; }
  const st=starsFor(levelIndex,blob.mass);
  save.stars[levelIndex]=Math.max(save.stars[levelIndex]||0, st);
  // ⭐ estrelas VISÍVEIS: contadas abertamente
  const coinGot=stars.filter(s=>s.got).length, coinTot=stars.length;
  if(coinTot) save.coins[levelIndex]=Math.max(save.coins[levelIndex]||0, coinGot);
  // 💎 SEGREDOS ocultos: guardamos, mas NUNCA revelamos quantos existem
  const secretGot=gems.filter(g=>g.got).length;
  if(secretGot) save.gems[levelIndex]=Math.max(save.gems[levelIndex]||0, secretGot);
  const NORMAL=LEVELS.filter(L=>!L.secret).length;
  // só avança o desbloqueio entre fases NORMAIS — a secreta é destravada por segredos, não por progressão
  if(!level.secret && levelIndex+1<NORMAL && save.unlocked<levelIndex+1) save.unlocked=levelIndex+1;
  persist();

  // === FASE SECRETA: final especial (você derrotou a Gosma-Mãe E descobriu tudo) ===
  if(level.secret){
    confetti(exitRect.x+exitRect.w/2, exitRect.y, 70);
    deferWin(()=>overlay("🏆✨ O VERDADEIRO FIM",
      `<div style="font-size:.9rem;color:#c9a6ff;line-height:1.5">Você escapou da Gosma-Mãe…<br>e descobriu <b>TUDO</b> que o jogo escondia.<br><span style="color:#8fb3a6">Pouquíssimos chegam até aqui. 💎</span></div>`,
      [{t:"Menu",cb:showMenu}], true), 0.9);
    return;
  }
  const isLast=levelIndex>=NORMAL-1;   // última fase NORMAL → conclui o MUNDO

  // === TELA DE CONCLUSÃO DO MUNDO (após a última fase normal) ===
  if(isLast){
    confetti(exitRect.x+exitRect.w/2, exitRect.y, 60);
    let tCoins=0,gCoins=0,fSec=0;
    LEVELS.forEach((L,i)=>{ if(L.secret)return; const c=(L.rows.join("").match(/\*/g)||[]).length;
      tCoins+=c; gCoins+=Math.min(c, save.coins[i]||0); fSec+=save.gems[i]||0; });
    const allSec = fSec>=NORMAL;
    let body=`<div style="font-size:.95rem;line-height:1.7">`
      + `<span style="color:#ffd24a;font-weight:700">⭐ ${gCoins}/${tCoins} estrelas</span>`;
    if(fSec>0) body += `<br><span style="color:#c9a6ff;font-weight:700">💎 ${fSec} segredo${fSec>1?'s':''}</span>`;
    body += `</div>`;
    body += allSec
      ? `<div style="font-size:.82rem;color:#c9a6ff;margin-top:10px">✨ Você desvendou o Vale por inteiro… algo despertou no mapa.</div>`
      : `<div style="font-size:.82rem;color:#8fb3a6;margin-top:10px">Que jornada! 🌿 O Vale ainda guarda mistérios pra quem voltar.</div>`;
    deferWin(()=>overlay("🎉 Mundo 1 Completo!", body, [{t:"Menu",cb:showMenu}], true), 0.9);
    return;
  }

  confetti(exitRect.x+exitRect.w/2, exitRect.y, 24);
  let sub="★".repeat(st)+"☆".repeat(3-st);
  if(coinTot){ sub += `<div style="font-size:.8rem;color:#ffd24a;margin-top:6px">⭐ ${coinGot}/${coinTot}</div>`; }
  // segredo: só reconhece SE você achou algum — e jamais diz o total nem que faltam
  if(secretGot){ sub += `<div style="font-size:.8rem;color:#c9a6ff;margin-top:4px">✨ Você encontrou um segredo…</div>`; }
  deferWin(()=>overlay("✅ Fase completa!", sub,
    [{t:"Próxima ▶",cb:()=>startGame(levelIndex+1)},{t:"Menu",ghost:true,cb:showMenu}], true), 0.45); }

// ==========================================================================
// RENDER
// ==========================================================================
function render(){
  const W=canvas.width,H=canvas.height, th=theme||THEMES.cave;
  ctx.setTransform(1,0,0,1,0,0);
  drawParallax(th);
  // partículas de AMBIENTE por mundo: fagulhas sobem (forge), neve desce (ice/glacier),
  // esporos sobem (cave), brilhos flutuam (deep/void). Dá identidade a cada tema.
  const amb=th.amb||"spore", down = (amb==="snow"||amb==="dust");
  for(const m of motes){
    if(amb==="fireflies"){                              // vaga-lumes: flutuam e pulsam (Mundo 1)
      const xx=m.x+Math.cos(T*0.4+m.ph)*22, yy=(m.y+Math.sin(T*0.5+m.ph)*18)%H, y2=yy<0?yy+H:yy;
      const tw=0.35+0.65*Math.abs(Math.sin(T*2.4+m.ph));
      ctx.save(); ctx.shadowColor=`rgba(${th.mote},.9)`; ctx.shadowBlur=7;
      ctx.fillStyle=`rgba(${th.mote},${0.55*tw})`; ctx.beginPath(); ctx.arc(xx,y2,m.r*0.75,0,7); ctx.fill(); ctx.restore();
      continue;
    }
    let yy = down ? (m.y + T*m.s)%H : (m.y - T*m.s)%H; if(yy<0)yy+=H;
    const drift = (amb==="snow") ? Math.sin(T*0.8+m.ph)*14 : Math.sin(T+m.ph)*6;
    const xx = m.x + drift;
    if(amb==="ember"){ const life=(yy/H); ctx.fillStyle=`rgba(255,${120+Math.floor(life*100)},40,${(1-life)*0.5})`;
      ctx.beginPath(); ctx.arc(xx,yy,m.r*0.9,0,7); ctx.fill(); }
    else if(amb==="snow"){ ctx.fillStyle=`rgba(${th.mote},${0.16+m.r*0.05})`;
      ctx.beginPath(); ctx.arc(xx,yy,m.r*0.9,0,7); ctx.fill(); }
    else if(amb==="spark"){ const tw=0.3+0.7*Math.abs(Math.sin(T*2+m.ph)); ctx.fillStyle=`rgba(${th.mote},${0.14*tw})`;
      ctx.fillRect(xx-m.r*0.6,yy-m.r*0.6,m.r*1.2,m.r*1.2); }
    else { ctx.fillStyle=`rgba(${th.mote},.10)`; ctx.beginPath(); ctx.arc(xx,yy,m.r,0,7); ctx.fill(); }
  }

  // ---- MUNDO: câmera + ZOOM ----
  const sx=shake>0?(Math.random()*2-1)*shake:0, sy=shake>0?(Math.random()*2-1)*shake:0;
  ctx.setTransform(zoom,0,0,zoom, -cam.x*zoom+sx, -cam.y*zoom+sy);
  const minX=cam.x-TILE, maxX=cam.x+camViewW, minY=cam.y-TILE, maxY=cam.y+camViewH;
  const vis = r => r.x<=maxX && r.x+r.w>=minX && r.y<=maxY && r.y+r.h>=minY;
  // preenche ABAIXO do mundo (quando a câmera sobe o chão p/ liberar espaço aos controles) — evita "fase flutuando"
  const worldBottom=ROWS*TILE;
  if(maxY>worldBottom){ ctx.fillStyle=th.tile; ctx.fillRect(minX, worldBottom, (maxX-minX)+TILE, (maxY-worldBottom)+TILE);
    ctx.fillStyle="rgba(0,0,0,.25)"; ctx.fillRect(minX, worldBottom, (maxX-minX)+TILE, 6); }

  // calor (atrás)
  for(const h of heatZones){ if(!vis(h))continue;
    const g=ctx.createLinearGradient(0,h.y,0,h.y+h.h);
    g.addColorStop(0,"rgba(255,120,40,.08)"); g.addColorStop(1,"rgba(255,70,25,.36)");
    ctx.fillStyle=g; ctx.fillRect(h.x,h.y,h.w,h.h);
    ctx.fillStyle="#ff7a2a"; ctx.fillRect(h.x,h.y+h.h-3,h.w,3);
    ctx.fillStyle="rgba(255,170,70,.7)";
    for(let i=0;i<3;i++){ const fx=h.x+7+i*10, fl=5+Math.sin(T*9+i+h.x)*3;
      ctx.beginPath(); ctx.moveTo(fx,h.y+h.h-3); ctx.quadraticCurveTo(fx+3,h.y+h.h-8-fl,fx+5,h.y+h.h-3); ctx.fill(); } }

  // tiles com relevo + topo de grama-gosma (tema)
  function drawTile(s){
    const above=blockedAt(s.x+16,s.y-16) || s.y<TILE;      // tem bloco/rocha ACIMA? (fantasma conta)
    const below=blockedAt(s.x+16,s.y+s.h+16);              // tem bloco ABAIXO?
    // base com leve sobreposição pra NÃO deixar fresta/linha entre blocos vizinhos
    ctx.fillStyle=th.tile; ctx.fillRect(s.x-0.6,s.y-0.6,s.w+1.2,s.h+1.2);
    // grama só no TOPO exposto (superfície)
    if(!above){ ctx.fillStyle=th.top; ctx.fillRect(s.x-0.6,s.y,s.w+1.2,6);
      ctx.fillStyle=th.top2; for(let i=0;i<2;i++){ const dx=s.x+8+i*14; ctx.beginPath();
        ctx.arc(dx,s.y+6,3+(i?1:0),0,Math.PI); ctx.fill(); }
      ctx.fillStyle="rgba(255,255,255,.05)"; ctx.fillRect(s.x+4,s.y+9,2,2); }   // textura só na superfície
    // sombra suave só na BASE exposta — dá volume SEM criar linhas no interior do bloco
    if(!below){ ctx.fillStyle="rgba(0,0,0,.18)"; ctx.fillRect(s.x-0.6,s.y+s.h-3,s.w+1.2,3); }
  }
  for(const s of solidTiles) if(vis(s)) drawTile(s);
  // GELO por cima: brilho gélido azul-claro (avisa visualmente que escorrega)
  for(const t of iceTiles){ if(!vis(t))continue;
    const gg=ctx.createLinearGradient(0,t.y,0,t.y+t.h); gg.addColorStop(0,"rgba(200,240,255,.72)"); gg.addColorStop(1,"rgba(120,190,225,.34)");
    ctx.fillStyle=gg; ctx.fillRect(t.x,t.y,t.w,t.h);
    ctx.fillStyle="rgba(255,255,255,.85)"; ctx.fillRect(t.x,t.y,t.w,2);
    ctx.strokeStyle="rgba(255,255,255,.35)"; ctx.lineWidth=1;          // rachaduras de gelo
    ctx.beginPath(); ctx.moveTo(t.x+7,t.y+4); ctx.lineTo(t.x+12,t.y+15); ctx.moveTo(t.x+22,t.y+6); ctx.lineTo(t.x+18,t.y+20); ctx.stroke(); }
  // paredes FANTASMA: renderizam IDÊNTICAS a um bloco sólido; só somem quando você entra
  for(const s of fakes){ if(!vis(s)||s.rev>=1)continue;
    if(s.rev>0){ ctx.globalAlpha=1-s.rev; drawTile(s); ctx.globalAlpha=1; }
    else drawTile(s); }
  // plataformas que DESMORONAM (rachadas; tremem antes de cair)
  for(const c of crumbles){ if(!vis(c))continue;
    if(c.solid){ const jit=c.t>0?(Math.random()*2-1)*c.t*3:0;
      ctx.save(); ctx.translate(jit,0);
      ctx.fillStyle="#6a5238"; ctx.fillRect(c.x,c.y,c.w,c.h);
      ctx.fillStyle="#8a6a48"; ctx.fillRect(c.x,c.y,c.w,3);
      ctx.strokeStyle="rgba(0,0,0,.4)"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(c.x+10,c.y); ctx.lineTo(c.x+14,c.y+13); ctx.lineTo(c.x+9,c.y+c.h);
      ctx.moveTo(c.x+22,c.y+4); ctx.lineTo(c.x+18,c.y+18); ctx.stroke(); ctx.restore();
    } else { ctx.globalAlpha=0.16; ctx.fillStyle="#6a5238"; ctx.fillRect(c.x,c.y,c.w,c.h); ctx.globalAlpha=1; }
  }
  // molas (trampolim)
  for(const sp of springs){ const c=sp.sq*6;
    ctx.fillStyle="#2a5a6a"; roundRect(sp.x+3,sp.y+8+c,sp.w-6,sp.h-10-c,5); ctx.fill();
    ctx.fillStyle="#9fe8ff"; roundRect(sp.x+2,sp.y+4+c,sp.w-4,7,4); ctx.fill();
    ctx.strokeStyle="rgba(159,232,255,.5)"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(sp.x+7,sp.y+22); ctx.lineTo(sp.x+16,sp.y+13+c); ctx.lineTo(sp.x+25,sp.y+22); ctx.stroke(); }
  // portas / placas
  if(doors.length){ const open=plateOn();
    for(const d of doors){ ctx.fillStyle=open?"rgba(126,224,107,.12)":"#3a2b3a"; ctx.fillRect(d.x,d.y,d.w,d.h);
      if(!open){ctx.strokeStyle="#5a4560";ctx.lineWidth=2;ctx.strokeRect(d.x+2,d.y+2,d.w-4,d.h-4);} } }
  for(const p of plates){ const on=plateOn(); ctx.fillStyle=on?"#7ee06b":"#caa64a";
    ctx.fillRect(p.x+4,p.y+(on?TILE-6:TILE-8),p.w-8,on?4:6);
    ctx.fillStyle="rgba(0,0,0,.25)"; ctx.fillRect(p.x+4,p.y+TILE-2,p.w-8,2); }

  // plataformas móveis (jangada de gosma)
  for(const m of movers){
    const g=ctx.createLinearGradient(0,m.y,0,m.y+m.h);
    g.addColorStop(0,"#7fe0d0"); g.addColorStop(1,"#2f8f86");
    ctx.fillStyle=g; roundRect(m.x,m.y,m.w,m.h,8); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.25)"; roundRect(m.x+4,m.y+3,m.w*0.4,4,3); ctx.fill();
    ctx.fillStyle="#2f8f86"; for(let i=0;i<3;i++){ const dx=m.x+8+i*(m.w-16)/2;
      ctx.beginPath(); ctx.arc(dx,m.y+m.h,3+Math.sin(T*4+i)*1.2,0,Math.PI); ctx.fill(); } }

  // espinhos — lâminas afiadas (cristal/osso) sobre base rochosa, com volume 3D e brilho
  for(const s of spikes){ const bot=s.y+TILE;
    // base rochosa escura de onde nascem os espinhos
    const bg=ctx.createLinearGradient(0,bot-8,0,bot); bg.addColorStop(0,"#432619"); bg.addColorStop(1,"#170b06");
    ctx.fillStyle=bg; roundRect(s.x, bot-7, TILE, 7, 2.5); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.07)"; ctx.fillRect(s.x+1,bot-7,TILE-2,1.4);
    // 3 lâminas (a central mais alta) — desenhadas de trás pra frente
    spikeBlade(s.x+6,  bot-3, s.y+9,  5);
    spikeBlade(s.x+26, bot-3, s.y+9,  5);
    spikeBlade(s.x+16, bot-3, s.y+2,  5.6); }

  // gosmas (bobbing)
  for(const p of pickups){ const by=p.y+Math.sin(T*3+p.x)*3;
    ctx.save(); ctx.shadowColor="#a6f08a"; ctx.shadowBlur=12;
    ctx.fillStyle="#a6f08a"; ctx.beginPath(); ctx.arc(p.x,by,p.r,0,7); ctx.fill(); ctx.restore();
    ctx.fillStyle="rgba(255,255,255,.6)"; ctx.beginPath(); ctx.arc(p.x-3,by-3,2.4,0,7); ctx.fill(); }

  // estrelas VISÍVEIS (coletável dourado — o jogador SABE que estão lá)
  for(const st of stars){ if(st.got||!vis({x:st.x-16,y:st.y-16,w:32,h:32}))continue;
    const sy=st.y+Math.sin(T*2.5+st.x)*3;
    ctx.save(); ctx.translate(st.x,sy); ctx.rotate(Math.sin(T*1.2+st.x)*0.18);
    ctx.shadowColor="#ffd24a"; ctx.shadowBlur=16;
    const sg=ctx.createLinearGradient(0,-st.r,0,st.r); sg.addColorStop(0,"#fff0a8"); sg.addColorStop(1,"#f0a83a");
    ctx.fillStyle=sg; ctx.beginPath();
    for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?st.r*0.44:st.r*1.08;
      const x=Math.cos(a)*rr, y=Math.sin(a)*rr; i?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.closePath(); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.85)"; ctx.beginPath(); ctx.arc(-st.r*0.22,-st.r*0.22,st.r*0.24,0,7); ctx.fill();
    ctx.restore(); }

  // gemas = SEMPRE VISÍVEIS (recompensa maior do jogo). A ÚNICA forma de escondê-las é
  // colocá-las atrás de uma PAREDE FALSA — a 2ª passada das paredes fantasma (abaixo) cobre
  // por cima; ao encostar na parede, ela some e revela a gema.
  for(const gm of gems){ if(gm.got||!vis({x:gm.x-16,y:gm.y-16,w:32,h:32}))continue;
    const gy=gm.y+Math.sin(T*2.5+gm.x)*3, r=gm.r;
    ctx.save(); ctx.translate(gm.x,gy); ctx.rotate(Math.sin(T*1.5+gm.x)*0.25);
    ctx.shadowColor="#c9a6ff"; ctx.shadowBlur=16;
    const gg=ctx.createLinearGradient(0,-r,0,r); gg.addColorStop(0,"#efe0ff"); gg.addColorStop(1,"#8a5fd0");
    ctx.fillStyle=gg; ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(r*0.8,0); ctx.lineTo(0,r); ctx.lineTo(-r*0.8,0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.7)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-r*0.8,0); ctx.lineTo(r*0.8,0); ctx.stroke();
    ctx.restore(); }

  // 2ª passada das PAREDES FANTASMA: re-desenha por CIMA das recompensas, escondendo
  // gema/estrela/gosma que estejam atrás (a rocha só some onde a geleca encosta).
  for(const s of fakes){ if(!vis(s)||s.rev>=1)continue;
    if(s.rev>0){ ctx.globalAlpha=1-s.rev; drawTile(s); ctx.globalAlpha=1; } else drawTile(s); }

  // inimigos: GUARDIÃO (patrulha = estrela espinhosa) vs PERSEGUIDOR/CHEFE (assombração = fantasma de 1 olho)
  for(const e of enemies){ const cx=e.x+e.w/2, cy=e.y+e.h/2, r=e.w/2, mad=e.mad||0, ed=(e.dir||1);
    if(e.type==="patrol"){
      // GUARDIÃO: estrela espinhosa vermelha (visual ORIGINAL, simples)
      ctx.save(); ctx.shadowColor="rgba(255,90,60,.5)"; ctx.shadowBlur=10; ctx.fillStyle="#e0574b";
      ctx.beginPath(); for(let i=0;i<10;i++){ const rr=r*(i%2?0.72:1.05+Math.sin(T*8+i)*0.06);
        const a=i/10*6.283, x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr; i?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(cx-4+ed*2,cy-2,2.6,0,7); ctx.arc(cx+5+ed*2,cy-2,2.6,0,7); ctx.fill();
      ctx.fillStyle="#3a0a0a"; ctx.beginPath(); ctx.arc(cx-4+ed*3,cy-2,1.3,0,7); ctx.arc(cx+5+ed*3,cy-2,1.3,0,7); ctx.fill();
      continue;
    }
    // ASSOMBRAÇÃO (perseguidor / chefe): fantasma escuro, translúcido, com UM olho que te segue.
    const boss=e.type==="boss";
    // TELEGRAFO do SALTO-PANCADA: marca vermelha pulsante no chão sob o chefe (avisa pra desviar/pular)
    if(boss && (e.mode==='wind'||e.mode==='leap')){
      const gy=(e.y0!=null?e.y0:e.y)+e.h+2, pw=e.w*(e.mode==='leap'?1.4:1.0)*(0.8+Math.sin(T*18)*0.2);
      ctx.save(); ctx.globalAlpha=0.5+Math.sin(T*18)*0.25;
      ctx.strokeStyle="#ff3b6b"; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(cx,gy,pw,5,0,0,7); ctx.stroke();
      ctx.fillStyle="rgba(255,59,107,.18)"; ctx.beginPath(); ctx.ellipse(cx,gy,pw,5,0,0,7); ctx.fill();
      ctx.restore();
    }
    const hitFlash = boss && e.hitT>0 && Math.floor(e.hitT*18)%2===0;   // pisca branco ao levar dano
    let bodyDark = boss ? (mad>0.1?"#7a1e5e":"#4a1440") : (mad>0.1?"#8a1830":"#5a1428");
    let bodyLite = boss ? (mad>0.1?"#c0246e":"#7a2860") : (mad>0.1?"#d0304a":"#8a2842");
    if(hitFlash){ bodyDark="#ffd0e0"; bodyLite="#ffffff"; }
    ctx.save();
    ctx.shadowColor = mad>0.1? `rgba(255,60,90,${0.45+mad*0.4})` : "rgba(120,40,90,.45)";
    ctx.shadowBlur = (boss?18:11) + mad*12;
    ctx.globalAlpha = 0.9;
    const grd=ctx.createLinearGradient(0,cy-r,0,cy+r*1.2); grd.addColorStop(0,bodyLite); grd.addColorStop(1,bodyDark);
    ctx.fillStyle=grd;
    // corpo: cúpula em cima + base ondulada (cauda de fantasma), balançando
    const baseY=cy+r*1.02;
    ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI,0); ctx.lineTo(cx+r,baseY);
    const humps=boss?5:4;
    for(let i=0;i<humps;i++){ const x2=cx+r-(2*r)*((i+1)/humps), wob=Math.sin(T*6+i*1.3+e.x0)*(r*0.12);
      ctx.quadraticCurveTo(cx+r-(2*r)*((i+0.5)/humps), baseY-r*0.34+wob, x2, baseY-Math.abs(wob)*0.4); }
    ctx.closePath(); ctx.fill();
    // wisps subindo (aura)
    ctx.globalAlpha=0.5*(0.5+mad*0.5);
    for(let i=0;i<3;i++){ const wx=cx+Math.sin(T*2+i*2)*r*0.5, wy=cy-r-6-((T*30+i*22)%26);
      ctx.beginPath(); ctx.arc(wx,wy,2.2-i*0.4,0,7); ctx.fill(); }
    ctx.restore();
    // UM olho grande que segue o jogador (mira no blob)
    const er=r*(boss?0.5:0.56), lx=(blob?blob.x+blob.w/2:cx)-cx, ly=(blob?blob.y+blob.h/2:cy)-cy;
    const ll=Math.hypot(lx,ly)||1, pdx=(lx/ll)*er*0.42, pdy=(ly/ll)*er*0.42;
    ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(cx,cy-r*0.05,er,0,7); ctx.fill();
    ctx.fillStyle = mad>0.35? "#c00018" : "#2a0812";
    ctx.beginPath(); ctx.arc(cx+pdx,cy-r*0.05+pdy,er*0.52,0,7); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.85)"; ctx.beginPath(); ctx.arc(cx+pdx-er*0.16,cy-r*0.05+pdy-er*0.16,er*0.18,0,7); ctx.fill();
    // "!" ao acordar (só perseguidor)
    if(e.type==="chaser"&&(e.alert||0)>0.05&&mad<0.3){ ctx.fillStyle=`rgba(255,220,120,${e.alert})`;
      ctx.font="bold 12px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("!",cx,cy-r-8); } }

  // portal de saída (anéis pulsantes + estrela)
  drawPortal(exitRect.x+exitRect.w/2, exitRect.y+exitRect.h/2);

  // trampolins 2x2 (superfície elástica — brilho sutil no topo)
  for(const tp of tramp){ const c=tp.sq*7;
    ctx.strokeStyle="rgba(139,233,255,.85)"; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(tp.x+4,tp.y+2+c); ctx.quadraticCurveTo(tp.x+tp.w/2,tp.y-6+c*2,tp.x+tp.w-4,tp.y+2+c); ctx.stroke(); }
  // ONDAS de choque (pulo/pouso/impacto/mola/reabsorção)
  for(const r of rings){ const al=Math.max(0,r.life/r.max);
    ctx.globalAlpha=al*0.8; ctx.strokeStyle=`rgba(${r.color},1)`; ctx.lineWidth=r.width*(0.4+al*0.6);
    ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,7); ctx.stroke(); }
  ctx.globalAlpha=1;
  // pedaços (gelecas soltas) — mini cubinhos de geleia VIVOS: têm mini-olhos (dica leve
  // de que estão vivos e dá pra interagir/tocar). Trampolins ficam azul.
  for(const g of globs){ const solid=g.solid, a=solid?1:0.5, gcx=g.x+g.w/2, gcy=g.y+g.h/2;
    const gx=g.x, gy=g.y, gw=g.w, gh=g.h, rr=Math.min(gw,gh)*0.28;
    const top = g.tramp?"#d2f6ff":"#eaffd2", mid=g.tramp?"#62c8e6":"#7fd06a", ed=g.tramp?"#2f8fb0":"#3d9636";
    // PLOP de nascimento: o pedaço recém-desprendido se "molda" com uma quicada elástica
    ctx.save();
    const gage = g.born ? (performance.now()-g.born)/240 : 2;
    if(gage<1){ const k=1-gage, wob=Math.cos(gage*8);
      const sx=1+0.34*k*wob, sy=1-0.30*k*wob;
      ctx.translate(gcx, gy+gh); ctx.scale(sx,sy); ctx.translate(-gcx, -(gy+gh)); }
    // sombra de contato (só quando já é bloco sólido)
    if(solid){ ctx.fillStyle="rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(gcx,gy+gh+1.5,gw*0.42,3,0,0,7); ctx.fill(); }
    // corpo: mini-cubo de geleia translúcido (mesmo estilo do herói)
    ctx.save(); ctx.globalAlpha=a;
    ctx.shadowColor=g.tramp?"rgba(120,230,255,.5)":"rgba(126,224,107,.42)"; ctx.shadowBlur=solid?8:4;
    const gg=ctx.createLinearGradient(0,gy,0,gy+gh); gg.addColorStop(0,top); gg.addColorStop(0.55,mid); gg.addColorStop(1,ed);
    ctx.fillStyle=gg; roundRect(gx,gy,gw,gh,rr); ctx.fill(); ctx.restore();
    ctx.globalAlpha=a;
    // sombreamento lateral 3D + núcleo interno
    ctx.save(); roundRect(gx,gy,gw,gh,rr); ctx.clip();
    const side=ctx.createLinearGradient(gx,0,gx+gw,0); side.addColorStop(0,"rgba(255,255,255,.10)"); side.addColorStop(0.5,"rgba(0,0,0,0)"); side.addColorStop(1,"rgba(0,30,10,.20)");
    ctx.fillStyle=side; ctx.fillRect(gx,gy,gw,gh);
    ctx.fillStyle="rgba(0,40,12,.12)"; roundRect(gx+gw*0.24,gy+gh*0.44,gw*0.52,gh*0.42,rr*0.5); ctx.fill();
    ctx.restore();
    // face-topo (lid brilhante = leitura de cubo)
    ctx.fillStyle="rgba(255,255,255,.28)"; roundRect(gx+gw*0.16,gy+gh*0.07,gw*0.68,gh*0.22,rr*0.6); ctx.fill();
    // bolhas internas
    ctx.fillStyle="rgba(255,255,255,.34)"; ctx.beginPath();
    ctx.arc(gcx-gw*0.13,gcy+gh*0.10,1.5,0,7); ctx.arc(gcx+gw*0.16,gcy-gh*0.02,1,0,7); ctx.fill();
    // contorno + rim light
    ctx.strokeStyle= g.tramp ? "rgba(150,235,255,.85)" : "rgba(80,170,70,.72)"; ctx.lineWidth=1.4; roundRect(gx+0.7,gy+0.7,gw-1.4,gh-1.4,rr-1); ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.5)"; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.arc(gx+rr+1.5,gy+rr+1.5,rr-1,Math.PI,Math.PI*1.5); ctx.stroke();
    ctx.globalAlpha=1;
    // MINI-OLHOS (só nas sólidas — as recém-soltas ainda estão "se formando")
    if(solid){
      const seed=(g.x*0.7+g.y*0.3), blink=Math.sin(T*1.3+seed)>0.93;   // pisca de vez em quando
      const look = blob ? Math.sign((blob.x+blob.w/2)-gcx)*0.8 : 0;      // olha levemente pro jogador
      const ox=g.w*0.16, oy=gcy-1, orr=Math.max(1.6,g.w*0.09);
      if(!blink){ ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(gcx-ox,oy,orr,0,7); ctx.arc(gcx+ox,oy,orr,0,7); ctx.fill();
        ctx.fillStyle="#0a2012"; ctx.beginPath(); ctx.arc(gcx-ox+look,oy,orr*0.55,0,7); ctx.arc(gcx+ox+look,oy,orr*0.55,0,7); ctx.fill(); }
      else { ctx.strokeStyle="#0a2012"; ctx.lineWidth=1.4; ctx.beginPath();
        ctx.moveTo(gcx-ox-orr,oy); ctx.lineTo(gcx-ox+orr,oy); ctx.moveTo(gcx+ox-orr,oy); ctx.lineTo(gcx+ox+orr,oy); ctx.stroke(); }
    }
    ctx.restore();                                        // fecha o PLOP de nascimento
  }

  // RASTRO DE GOSMA — cópias que derretem (achatam e afundam) ao sumir, dão a leitura de slime
  for(const gh of trail){ const k=gh.life/gh.max, al=k*0.34;                 // k: 1→0 conforme some
    const melt=1-k;                                                          // quanto mais velho, mais "derretido"
    const w=gh.w*(1+melt*0.28), h=gh.h*(1-melt*0.45), x=gh.x-(w-gh.w)/2, y=gh.y+(gh.h-h);  // espalha e afunda
    ctx.globalAlpha=al; ctx.fillStyle=gh.cling?"#7fe0d0":(gh.melt?"#ffbe6a":"#8bec7c");
    roundRect(x, y, w, h, Math.min(w,h)*0.4); ctx.fill();
    ctx.globalAlpha=al*0.5; ctx.fillStyle="rgba(255,255,255,.5)";           // brilho úmido no topo
    roundRect(x+w*0.2, y+h*0.12, w*0.6, h*0.28, h*0.2); ctx.fill(); }
  ctx.globalAlpha=1;

  // MURALHA DEVORADORA — mar de gosma da Gosma-Mãe avançando pela esquerda (come a tela)
  if(devourEdge!=null){
    const x1=devourEdge, y0=cam.y-80, hh=camViewH+160, x0=cam.x-100, step=20;
    ctx.save();
    const gd=ctx.createLinearGradient(x0,0,x1,0); gd.addColorStop(0,"#160820"); gd.addColorStop(.65,"#3a1055"); gd.addColorStop(1,"#8a24a0");
    ctx.fillStyle=gd;
    ctx.beginPath(); ctx.moveTo(x0,y0-1);
    ctx.lineTo(x1,y0-1);
    for(let y=y0; y<=y0+hh; y+=step){ const wob=Math.sin(y*0.06+T*4)*11 + Math.sin(y*0.14-T*7)*6; ctx.lineTo(x1+wob, y); }
    ctx.lineTo(x0,y0+hh+1); ctx.closePath(); ctx.fill();
    // crista brilhante (a "boca")
    ctx.strokeStyle="rgba(210,130,245,.85)"; ctx.lineWidth=3; ctx.beginPath();
    for(let y=y0; y<=y0+hh; y+=step){ const wob=Math.sin(y*0.06+T*4)*11 + Math.sin(y*0.14-T*7)*6; if(y===y0)ctx.moveTo(x1+wob,y); else ctx.lineTo(x1+wob,y); } ctx.stroke();
    // bolhas subindo dentro da gosma
    for(let i=0;i<6;i++){ const bx=x1-24-((T*30+i*40)%140), by=y0+((i*97+T*22)% (hh));
      ctx.fillStyle="rgba(180,110,220,.4)"; ctx.beginPath(); ctx.arc(bx,by,3+ (i%3),0,7); ctx.fill(); }
    // olhos famintos na altura do jogador
    const ey=Math.max(y0+50, Math.min(y0+hh-50, blob.y+blob.h*0.4));
    for(let i=0;i<2;i++){ const ox=x1-26-i*24, oy=ey+i*20-6;
      ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(ox,oy,7,0,7); ctx.fill();
      const lx=Math.max(-2,Math.min(2,(blob.x-ox)*0.02));
      ctx.fillStyle="#c0006a"; ctx.beginPath(); ctx.arc(ox+3+lx,oy,3.6,0,7); ctx.fill(); }
    ctx.restore();
  }

  drawBlob();
  drawWater();                     // ÁGUA por cima → quem está submerso ganha tom azulado (protótipo visual)

  // PROJÉTEIS de gosma do chefe (bolhas brilhantes com rastro)
  for(const s of shots){ ctx.save(); ctx.shadowColor="rgba(210,74,154,.75)"; ctx.shadowBlur=13;
    const gg=ctx.createRadialGradient(s.x-2,s.y-3,1,s.x,s.y,s.r); gg.addColorStop(0,"#ffa8d8"); gg.addColorStop(1,"#9c1e66");
    ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,7); ctx.fill(); ctx.restore();
    ctx.fillStyle="rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(s.x-3,s.y-3,s.r*0.3,0,7); ctx.fill(); }

  for(const p of particles){ ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill(); }
  ctx.globalAlpha=1;

  // vinheta
  ctx.setTransform(1,0,0,1,0,0);
  const vg=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.75);
  vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,0,.42)");
  ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  // BARRA DE VIDA DO CHEFE (topo da tela) — durante a luta
  const bossE=enemies&&enemies.find(e=>e.type==="boss");
  if(bossE){ const bw=W*0.6, bh=16*(W/640), bx=(W-bw)/2, byy=18*(W/640), maxHp=3;
    ctx.fillStyle="rgba(0,0,0,.45)"; roundRect(bx-4,byy-4,bw+8,bh+8,8); ctx.fill();
    for(let i=0;i<maxHp;i++){ const seg=bw/maxHp, sx=bx+i*seg;
      ctx.fillStyle = i< (bossE.hp||0) ? (bossE.hitT>0?"#ffffff":"#ff4d7e") : "rgba(255,255,255,.12)";
      roundRect(sx+3,byy,seg-6,bh,5); ctx.fill(); }
    ctx.fillStyle="#ffd0e0"; ctx.font=`bold ${Math.round(12*(W/640))}px sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("A GOSMA-MÃE", W/2, byy+bh/2); }
  // transição de entrada da fase (fade)
  if(transition>0){ ctx.fillStyle=`rgba(0,0,0,${transition})`; ctx.fillRect(0,0,W,H); }
}
function isSolidAt(px,py){ for(const s of solidTiles) if(px>=s.x&&px<s.x+s.w&&py>=s.y&&py<s.y+s.h) return true; return false; }
// parede FANTASMA ainda "cheia" (não atravessada) conta como sólido pra decidir grama/sombra —
// assim o piso de um segredo NÃO ganha grama e não denuncia o esconderijo.
function isFakeAt(px,py){ for(const f of fakes) if(f.rev<1 && px>=f.x&&px<f.x+f.w&&py>=f.y&&py<f.y+f.h) return true; return false; }
function blockedAt(px,py){ return isSolidAt(px,py)||isFakeAt(px,py); }

// ---- fundo em parallax (estilo plataforma) ----
function hillLayer(color, factor, baseY, spacing, height){
  const W=canvas.width, H=canvas.height;
  ctx.fillStyle=color;
  const off=-((cam.x*zoom*factor)%spacing), by=baseY - cam.y*zoom*0.06;
  ctx.beginPath(); ctx.moveTo(-spacing, H+2);
  for(let x=off-spacing; x<W+spacing; x+=spacing)
    ctx.quadraticCurveTo(x+spacing*0.5, by-height, x+spacing, by);
  ctx.lineTo(W+spacing, H+2); ctx.closePath(); ctx.fill();
}
function cloudShape(x,y,r){ ctx.beginPath();
  ctx.arc(x,y,r,0,7); ctx.arc(x+r*0.9,y+4,r*0.7,0,7); ctx.arc(x-r*0.9,y+5,r*0.66,0,7); ctx.arc(x+r*0.25,y-r*0.5,r*0.58,0,7); ctx.fill(); }
function peakLayer(color, factor, baseY, spacing, height){   // montanhas pontudas (silhueta)
  const W=canvas.width, H=canvas.height;
  ctx.fillStyle=color; const off=-((cam.x*zoom*factor)%spacing), by=baseY - cam.y*zoom*0.05;
  ctx.beginPath(); ctx.moveTo(-spacing, H+2);
  for(let x=off-spacing; x<W+spacing; x+=spacing){ ctx.lineTo(x+spacing*0.5, by-height); ctx.lineTo(x+spacing, by); }
  ctx.lineTo(W+spacing, H+2); ctx.closePath(); ctx.fill();
}
// SILHUETA característica de cada mundo (crystal/berg/stalac/chunk/peak)
function decoLayer(th){ const kind=th.deco, W=canvas.width,H=canvas.height,sc=W/640;
  ctx.fillStyle=th.far;
  if(kind==="stalac"){ const sp=150*sc, off=-((cam.x*zoom*0.12)%sp);   // estalactites do teto (caverna)
    ctx.beginPath(); ctx.moveTo(-sp,-2);
    for(let x=off-sp;x<W+sp;x+=sp){ const hh=(55+(Math.abs(x)*7%50))*sc; ctx.lineTo(x+sp*0.5,hh); ctx.lineTo(x+sp,-2); }
    ctx.lineTo(W+sp,-2); ctx.closePath(); ctx.fill();
    peakLayer(th.far,0.10,H*0.66,240*sc,170*sc);
  } else if(kind==="crystal"){ const sp=118*sc, off=-((cam.x*zoom*0.12)%sp), by=H*0.72-cam.y*zoom*0.05;  // cristais (profundezas)
    ctx.beginPath(); ctx.moveTo(-sp,H+2);
    for(let x=off-sp;x<W+sp;x+=sp){ const hh=(170+(Math.abs(x)*13%140))*sc; ctx.lineTo(x+sp*0.42,by-hh); ctx.lineTo(x+sp,by); }
    ctx.lineTo(W+sp,H+2); ctx.closePath(); ctx.fill();
  } else if(kind==="chunk"){ const sp=200*sc, off=-((cam.x*zoom*0.10)%sp);   // pedras flutuantes (vazio)
    for(let x=off-sp;x<W+sp;x+=sp){ const y=(H*0.28+(Math.abs(x)*17%Math.floor(H*0.38)))-cam.y*zoom*0.04, s=(22+(Math.abs(x)*7%20))*sc;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+s,y-s*0.4); ctx.lineTo(x+s*1.4,y+s*0.3); ctx.lineTo(x+s*0.6,y+s*0.7); ctx.closePath(); ctx.fill(); }
    peakLayer(th.far,0.10,H*0.70,260*sc,120*sc);
  } else if(kind==="berg"){ peakLayer(th.far,0.10,H*0.70,300*sc,140*sc); }  // icebergs largos
  else if(kind==="grove"){                                                    // FLORESTA (Mundo 1)
    const by=H*0.74-cam.y*zoom*0.05;
    // fileira distante de árvores (silhueta)
    const sp=112*sc, off=-((cam.x*zoom*0.13)%sp);
    for(let x=off-sp;x<W+sp;x+=sp){ const tx=x+sp*0.5, r=(32+(Math.abs(Math.round(x))*7%20))*sc, ty=by-r*1.5;
      ctx.fillRect(tx-3*sc,ty,6*sc,(by-ty)+2);
      ctx.beginPath(); ctx.arc(tx,ty,r,0,7); ctx.arc(tx-r*0.62,ty+r*0.32,r*0.66,0,7); ctx.arc(tx+r*0.62,ty+r*0.32,r*0.66,0,7); ctx.arc(tx,ty-r*0.5,r*0.6,0,7); ctx.fill(); }
    hillLayer(th.far,0.10,H*0.78,320*sc,120*sc);
  }
  else { peakLayer(th.far,0.10,H*0.66,240*sc,220*sc); }                       // 'peak' padrão
}
// ---- PARALLAX com ARTE (imagens de IA) — Mundo 1 · Vale ----
function bandLayer(src, factor, baseYf, hf){
  if(!src) return; const iw=src.naturalWidth||src.width, ih=src.naturalHeight||src.height; if(!iw) return;
  const W=canvas.width, H=canvas.height;
  const sw=Math.floor(iw*0.955), sh=ih;               // recorta ~4.5% da direita (marca d'água ✦)
  const dh=H*hf, dw=dh*(sw/sh), y=H*baseYf-dh - cam.y*zoom*0.04;
  let off=-((cam.x*zoom*factor)%dw); if(off>0)off-=dw;
  for(let x=off; x<W; x+=dw) ctx.drawImage(src, 0,0,sw,sh, x,y,dw,dh);
}
function drawValeArt(){
  const W=canvas.width, H=canvas.height, sky=BG.ceu, iw=sky.naturalWidth, ih=sky.naturalHeight;
  const sw=Math.floor(iw*0.955);
  // CÉU (cobre a tela; parallax leve, sem repetir)
  const s=Math.max(W/sw, H/ih)*1.04, dw=sw*s, dh=ih*s;
  const sx=-((cam.x*zoom*0.05)%dw), sy=(H-dh)*0.5 - cam.y*zoom*0.02;
  for(let x=sx-dw; x<W; x+=dw) ctx.drawImage(sky, 0,0,sw,ih, x,sy,dw,dh);
  // NÉVOA DO VALE: preenche do horizonte pra baixo com verde escuro (evita o "vazio" de céu
  // abaixo das copas — a base da floresta nunca fica flutuando sobre o nada).
  const hy=H*0.46 - cam.y*zoom*0.03, hz=ctx.createLinearGradient(0,hy,0,H);
  hz.addColorStop(0,"rgba(20,46,30,0)"); hz.addColorStop(0.4,"#183a25"); hz.addColorStop(1,"#0b2013");
  ctx.fillStyle=hz; ctx.fillRect(0,hy,W,H-hy+2);
  bandLayer(BG.montanhas, 0.12, 0.62, 0.42);          // montanhas distantes (no horizonte)
  bandLayer(BG.floresta,  0.30, 0.78, 0.42);          // floresta média (fundo)
}
function drawParallax(th){
  const W=canvas.width, H=canvas.height, sc=W/640;
  if(th.art==="vale" && groveArtReady()){ drawValeArt(); return; }   // Mundo 1 usa a arte de IA
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,th.sky0); sky.addColorStop(1,th.sky1);
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
  // brilho característico no horizonte (lava na forja, aura no gelo/vazio)
  if(th.glow){ const gy=H*0.74 - cam.y*zoom*0.05;
    const gg=ctx.createLinearGradient(0,gy-H*0.24,0,gy+H*0.12);
    gg.addColorStop(0,`rgba(${th.glow},0)`); gg.addColorStop(1,`rgba(${th.glow},.30)`);
    ctx.fillStyle=gg; ctx.fillRect(0,gy-H*0.24,W,H*0.36); }
  // estrelas / brilhos no céu (twinkle)
  for(let i=0;i<46;i++){ let sx=((i*137*sc - cam.x*zoom*0.06)%(W+30)); if(sx<-15)sx+=W+30;
    const y=((i*71)%Math.floor(H*0.66)), tw=0.3+0.7*Math.abs(Math.sin(T*1.6+i*1.3));
    ctx.globalAlpha=tw*0.5; ctx.fillStyle=`rgb(${th.cloud})`; const s=(i%7===0?2:1.2)*sc; ctx.fillRect(sx,y,s,s); }
  ctx.globalAlpha=1;
  // raios de luz suaves descendo (god-rays) — dão vida e volume ao céu
  if(th.glow){ ctx.save(); ctx.globalCompositeOperation="lighter";
    for(let i=0;i<4;i++){ const bx=((i*197*sc + W*0.2 - cam.x*zoom*0.05)%(W+200))-100, sw=(50+i*20)*sc;
      const rg=ctx.createLinearGradient(bx,0,bx+sw,H*0.6); rg.addColorStop(0,`rgba(${th.glow},0)`); rg.addColorStop(0.5,`rgba(${th.glow},.05)`); rg.addColorStop(1,`rgba(${th.glow},0)`);
      ctx.fillStyle=rg; ctx.beginPath(); ctx.moveTo(bx,0); ctx.lineTo(bx+sw,0); ctx.lineTo(bx+sw*2.2,H*0.62); ctx.lineTo(bx+sw*1.1,H*0.62); ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
  // silhueta característica do mundo bem ao fundo
  decoLayer(th);
  // morros arredondados distantes
  hillLayer(th.far, 0.18, H*0.70, 300*sc, 150*sc);
  // nuvens
  ctx.fillStyle=`rgba(${th.cloud},.15)`;
  for(let i=0;i<7;i++){ let x=((i*250*sc - (cam.x*zoom*0.26 + T*9*sc))%(W+340)); if(x<-170)x+=W+340;
    cloudShape(x, (30+(i*53)%130)*sc - cam.y*zoom*0.03, (22+(i%3)*12)*sc); }
  // morros médios
  hillLayer(th.mid, 0.38, H*0.84, 230*sc, 130*sc);
  // morros da frente (mais escuros e rápidos — profundidade)
  hillLayer(th.sky1, 0.62, H*0.98, 180*sc, 90*sc);
  // folhagem de PRIMEIRO PLANO (arbustos escuros na base — enquadra a cena, dá profundidade)
  if(th.deco==="grove"){ ctx.fillStyle=th.sky1; const sp=70*sc, off=-((cam.x*zoom*0.8)%sp), by=H+4;
    for(let x=off-sp;x<W+sp;x+=sp){ const r=(26+(Math.abs(Math.round(x))*5%16))*sc;
      ctx.beginPath(); ctx.arc(x,by,r,Math.PI,0); ctx.arc(x+sp*0.5,by,r*0.8,Math.PI,0); ctx.fill(); } }
}
function drawPortal(cx,cy){
  ctx.save();
  for(let i=0;i<3;i++){ const r=10+i*5+Math.sin(T*2+i)*2, a=0.5-i*0.14;
    ctx.strokeStyle=`rgba(126,224,107,${a})`; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.stroke(); }
  ctx.shadowColor="#7ee06b"; ctx.shadowBlur=18; ctx.fillStyle="#7ee06b";
  ctx.beginPath(); ctx.arc(cx,cy,7,0,7); ctx.fill(); ctx.restore();
  // sparkles girando
  for(let i=0;i<4;i++){ const a=T*2+i*1.57, r=14; ctx.fillStyle="rgba(182,246,164,.9)";
    ctx.beginPath(); ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,1.6,0,7); ctx.fill(); }
  ctx.fillStyle="#07160e"; ctx.font="bold 13px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText("★",cx,cy+1);
}

// caminho de gosma (blob ondulado)
// uma lâmina de espinho afiada com volume 3D, espinha especular e ponta brilhante
function spikeBlade(cx, baseY, topY, hw){
  // sombra projetada (leve deslocamento pra direita)
  ctx.fillStyle="rgba(0,0,0,.30)";
  ctx.beginPath(); ctx.moveTo(cx-hw+2,baseY); ctx.lineTo(cx+2,topY+3); ctx.lineTo(cx+hw+2,baseY); ctx.closePath(); ctx.fill();
  // corpo com gradiente lateral (quente na esquerda → escuro na direita)
  const g=ctx.createLinearGradient(cx-hw,0,cx+hw,0);
  g.addColorStop(0,"#ffb0b0"); g.addColorStop(0.42,"#e34a3f"); g.addColorStop(1,"#7c1414");
  ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(cx-hw,baseY); ctx.lineTo(cx,topY); ctx.lineTo(cx+hw,baseY); ctx.closePath(); ctx.fill();
  // face esquerda iluminada (leitura de 3D)
  ctx.fillStyle="rgba(255,255,255,.20)"; ctx.beginPath();
  ctx.moveTo(cx-hw,baseY); ctx.lineTo(cx,topY); ctx.lineTo(cx-hw*0.3,baseY); ctx.closePath(); ctx.fill();
  // espinha especular ao longo da aresta
  ctx.strokeStyle="rgba(255,255,255,.55)"; ctx.lineWidth=1.1;
  ctx.beginPath(); ctx.moveTo(cx-hw*0.18,baseY-2); ctx.lineTo(cx,topY+1.5); ctx.stroke();
  // ponta afiada brilhante
  ctx.fillStyle="rgba(255,240,240,.92)"; ctx.beginPath(); ctx.arc(cx,topY+1.4,1.05,0,7); ctx.fill();
}
function slime(cx,cy,rx,ry,amp,seed){
  const N=18; ctx.beginPath();
  for(let i=0;i<=N;i++){ const a=(i/N)*Math.PI*2, w=1+amp*Math.sin(a*3+T*3+seed);
    const x=cx+Math.cos(a)*rx*w, y=cy+Math.sin(a)*ry*w; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
  ctx.closePath();
}
// personagem: CUBO GELATINOSO estilo RPG (translúcido, face-topo 3D, bolhas, olhos)
// ÁGUA REALISTA (Mundo 2): gradiente de profundidade, raios de luz (god-rays), cáusticas animadas,
// superfície com espuma + brilho especular, bolhas subindo e reflexo. Corpo translúcido → submerso azula.
function drawWater(){
  if(!water||!water.length) return;
  // bounds + superfície (tile-topo mais alto) por coluna
  let minTX=1e9,maxTX=-1e9,yTop=1e9,yBot=-1e9; const surf={};
  for(const r of water){ const tx=r.x/TILE|0, ty=r.y/TILE|0;
    if(tx<minTX)minTX=tx; if(tx>maxTX)maxTX=tx; if(r.y<yTop)yTop=r.y; if(r.y+TILE>yBot)yBot=r.y+TILE;
    if(surf[tx]===undefined||ty<surf[tx])surf[tx]=ty; }
  const x0=minTX*TILE, x1=(maxTX+1)*TILE, H=yBot-yTop;
  const wave=xa=>2.7*Math.sin(xa*0.05+T*1.9)+1.4*Math.sin(xa*0.11-T*1.35)+0.6*Math.sin(xa*0.22+T*2.7);

  ctx.save();
  // ---- clip ao corpo d'água (tiles) ----
  ctx.beginPath(); for(const r of water) ctx.rect(r.x,r.y,TILE,TILE); ctx.clip();

  // 1) GRADIENTE DE PROFUNDIDADE (raso/claro em cima → fundo escuro)
  const g=ctx.createLinearGradient(0,yTop,0,yBot);
  g.addColorStop(0,"rgba(120,210,236,.42)"); g.addColorStop(0.45,"rgba(40,142,203,.54)"); g.addColorStop(1,"rgba(9,52,104,.66)");
  ctx.fillStyle=g; ctx.fillRect(x0,yTop,x1-x0,H);

  // 2) reflexo aerado logo abaixo da superfície (faixa clara)
  ctx.fillStyle="rgba(190,235,255,.10)"; ctx.fillRect(x0,yTop,x1-x0,Math.min(10,H*0.16));

  ctx.globalCompositeOperation="lighter";
  // 3) GOD-RAYS suaves: feixes de luz difusos descendo, oscilando de leve
  for(let i=0;i<7;i++){ const rx=x0+(i/7)*(x1-x0)+Math.sin(T*0.3+i*1.3)*22;
    const gr=ctx.createLinearGradient(rx,yTop,rx+46,yBot);
    gr.addColorStop(0,"rgba(185,238,255,.085)"); gr.addColorStop(0.55,"rgba(185,238,255,.028)"); gr.addColorStop(1,"rgba(185,238,255,0)");
    ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(rx-3,yTop); ctx.lineTo(rx+12,yTop); ctx.lineTo(rx+12+58,yBot); ctx.lineTo(rx-3+42,yBot); ctx.closePath(); ctx.fill(); }
  // 4) CÁUSTICAS orgânicas (duas frequências) — rede de luz tremeluzente, mais forte no topo
  for(let cy=yTop+4; cy<yBot; cy+=10){ const k=Math.pow(1-(cy-yTop)/H,1.3);
    ctx.strokeStyle="rgba(205,249,255,"+(0.035+0.095*k).toFixed(3)+")"; ctx.lineWidth=1.4; ctx.beginPath();
    for(let cx=x0;cx<=x1;cx+=6){ const yy=cy+Math.sin(cx*0.10+T*1.6+cy*0.15)*2.6+Math.sin(cx*0.05-T*1.1)*2.0; cx===x0?ctx.moveTo(cx,yy):ctx.lineTo(cx,yy);} ctx.stroke(); }
  // 5) CÁUSTICAS DO FUNDO: luz dançando mais brilhante no fundo da poça
  for(let f=0;f<2;f++){ ctx.strokeStyle="rgba(215,250,255,"+(0.13-f*0.04).toFixed(2)+")"; ctx.lineWidth=2.4-f*0.6; ctx.beginPath();
    const fy=yBot-7-f*6; for(let cx=x0;cx<=x1;cx+=5){ const yy=fy+Math.sin(cx*0.14+T*2.1+f*1.5)*2.6; cx===x0?ctx.moveTo(cx,yy):ctx.lineTo(cx,yy);} ctx.stroke(); }
  ctx.globalCompositeOperation="source-over";
  // 6) escurecimento de profundidade no fundo (dá volume)
  const dg=ctx.createLinearGradient(0,yBot-22,0,yBot); dg.addColorStop(0,"rgba(2,18,46,0)"); dg.addColorStop(1,"rgba(2,14,38,.42)");
  ctx.fillStyle=dg; ctx.fillRect(x0,yBot-22,x1-x0,22);

  // 5) BOLHAS subindo
  for(const r of water){ const tx=r.x/TILE|0, ty=r.y/TILE|0, seed=tx*0.7+ty*1.9, bp=((T*0.45+seed)%1);
    const bx=r.x+TILE*(0.25+0.5*(0.5+0.5*Math.sin(seed*6))), by=r.y+TILE*(1-bp)-bp*4, br=0.8+((seed*3)%1)*1.7;
    ctx.fillStyle="rgba(225,247,255,"+(0.4*(1-bp)).toFixed(2)+")"; ctx.beginPath(); ctx.arc(bx,by,br,0,7); ctx.fill(); }
  ctx.restore();  // fim do clip

  // 6) SUPERFÍCIE ondulada (fora do clip → crista passa um tico acima): espuma + fill aerado + brilho
  ctx.save();
  // fill aerado logo abaixo da linha da onda
  ctx.beginPath(); let started=false;
  for(let tx=minTX;tx<=maxTX;tx++){ if(surf[tx]===undefined){ if(started){ctx.lineTo((tx)*TILE,yBot);} continue; }
    const sx=tx*TILE, sy=surf[tx]*TILE; for(let s=0;s<=2;s++){ const xx=sx+s/2*TILE, yy=sy+wave(xx); started?ctx.lineTo(xx,yy):(ctx.moveTo(xx,yy),started=true);} }
  const lastX=(maxTX+1)*TILE; ctx.lineTo(lastX, (surf[maxTX]||minTX)*TILE+8); ctx.lineTo(x0,(surf[minTX]||minTX)*TILE+8); ctx.closePath();
  const sg=ctx.createLinearGradient(0,yTop-4,0,yTop+12); sg.addColorStop(0,"rgba(210,245,255,.5)"); sg.addColorStop(1,"rgba(150,220,245,0)");
  ctx.fillStyle=sg; ctx.fill();
  // linha de ESPUMA brilhante seguindo a onda
  ctx.strokeStyle="rgba(232,250,255,.8)"; ctx.lineWidth=1.8; ctx.lineCap="round"; ctx.beginPath(); started=false;
  for(let tx=minTX;tx<=maxTX;tx++){ if(surf[tx]===undefined){started=false;continue;} const sx=tx*TILE, sy=surf[tx]*TILE;
    for(let s=0;s<=3;s++){ const xx=sx+s/3*TILE, yy=sy+wave(xx); started?ctx.lineTo(xx,yy):(ctx.moveTo(xx,yy),started=true);} }
  ctx.stroke();
  // BRILHOS especulares cintilando nas cristas
  for(let tx=minTX;tx<=maxTX;tx++){ if(surf[tx]===undefined)continue; const xx=tx*TILE+TILE*0.5, sy=surf[tx]*TILE+wave(xx);
    const tw=Math.sin(T*3+tx*1.7); if(tw>0.6){ ctx.fillStyle="rgba(255,255,255,"+(0.5*(tw-0.6)/0.4).toFixed(2)+")"; ctx.beginPath(); ctx.arc(xx,sy-1,1.6,0,7); ctx.fill(); } }
  ctx.restore();
}
function drawBlob(){
  const b=blob; if(b.gone) return;                 // morreu: virou espatifo, não desenha o corpo
  const sq=Math.max(-0.18,Math.min(0.18,b.vy/4000)), jig=Math.sin(T*6)*0.02;
  const w=b.w*(1-sq*0.5+jig), h=b.h*(1+sq-jig);
  const x=b.x+(b.w-w)/2, y=b.y+(b.h-h), cx=x+w/2, r=Math.min(w,h)*0.26;
  const flashing=b.flash>0&&Math.floor(b.flash*20)%2===0;
  let a,bl,ed;                                   // a=topo, bl=base, ed=cor da aresta
  if(flashing){a="#ffd0d0";bl="#ff6a6a";ed="#c83030";}
  else if(b.melting){a="#ffe0a8";bl="#e0842a";ed="#b45a10";}
  else if(b.cling){a="#cffaf0";bl="#33b0a0";ed="#1e7e72";}
  else {a="#e6ffc8";bl="#5ec84a";ed="#2f8f30";}

  // sombra de contato (elíptica)
  ctx.fillStyle="rgba(0,0,0,.30)"; ctx.beginPath(); ctx.ellipse(cx,b.y+b.h+2,w*0.44,5,0,0,7); ctx.fill();

  // ---- CORPO: cubo de geleia translúcido ----
  ctx.save(); ctx.shadowColor=b.melting?"rgba(255,150,70,.55)":(b.cling?"rgba(120,240,220,.5)":"rgba(126,224,107,.5)"); ctx.shadowBlur=14;
  const gr=ctx.createLinearGradient(0,y,0,y+h);
  gr.addColorStop(0,a); gr.addColorStop(0.5,bl); gr.addColorStop(1,ed);
  ctx.globalAlpha=0.9; ctx.fillStyle=gr; roundRect(x,y,w,h,r); ctx.fill(); ctx.globalAlpha=1; ctx.restore();

  // sombreamento das FACES do cubo (lado direito e base mais escuros = volume 3D)
  ctx.save(); roundRect(x,y,w,h,r); ctx.clip();
  const side=ctx.createLinearGradient(x,0,x+w,0); side.addColorStop(0,"rgba(255,255,255,.10)"); side.addColorStop(0.5,"rgba(0,0,0,0)"); side.addColorStop(1,"rgba(0,30,10,.22)");
  ctx.fillStyle=side; ctx.fillRect(x,y,w,h);
  // núcleo interno (volume de geleia, mais escuro no centro-baixo)
  ctx.fillStyle="rgba(0,40,12,.14)"; roundRect(x+w*0.22,y+h*0.40,w*0.56,h*0.46,r*0.5); ctx.fill();
  // refração/cáustica: faixa curva clara atravessando
  ctx.strokeStyle="rgba(255,255,255,.14)"; ctx.lineWidth=Math.max(2,w*0.06);
  ctx.beginPath(); ctx.moveTo(x+w*0.15,y+h*0.62); ctx.quadraticCurveTo(x+w*0.5,y+h*0.5,x+w*0.9,y+h*0.66); ctx.stroke();
  ctx.restore();

  // FACE-TOPO do cubo (lid brilhante = leitura de cubo 3D)
  ctx.fillStyle="rgba(255,255,255,.26)"; roundRect(x+w*0.14,y+h*0.05,w*0.72,h*0.20,r*0.55); ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.14)"; roundRect(x+w*0.14,y+h*0.05,w*0.72,h*0.34,r*0.55); ctx.fill();

  // bolhas internas (mais e com brilho)
  for(let i=0;i<4;i++){ const bx=x+w*(0.28+0.16*i)+Math.sin(T*1.5+i*2)*2, by=y+h*(0.46+0.11*i)+Math.cos(T*1.3+i)*2, br=1.3+((i*7)%3)*0.7;
    ctx.fillStyle="rgba(255,255,255,.34)"; ctx.beginPath(); ctx.arc(bx,by,br,0,7); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.6)"; ctx.beginPath(); ctx.arc(bx-br*0.4,by-br*0.4,br*0.4,0,7); ctx.fill(); }

  // rim light (aresta superior-esquerda acesa)
  ctx.strokeStyle="rgba(255,255,255,.5)"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(x+r+2,y+r+2,r-1,Math.PI,Math.PI*1.5); ctx.stroke();
  // contorno geral sutil
  ctx.strokeStyle="rgba(255,255,255,.22)"; ctx.lineWidth=1.5; roundRect(x+1,y+1,w-2,h-2,r-1); ctx.stroke();
  // specular (brilho principal)
  ctx.fillStyle="rgba(255,255,255,.7)"; ctx.beginPath(); ctx.ellipse(x+w*0.3,y+h*0.2,w*0.14,h*0.08,-0.5,0,7); ctx.fill();

  // ---- OLHOS ----
  const dir=b.vx>12?1:(b.vx<-12?-1:0), ex=w*0.2, ey=y+h*0.5, er=Math.max(2.8,w*0.11);
  const blink=b.blink<0.12;
  if(!blink){ ctx.fillStyle="#fff"; eye(cx-ex,ey,er); eye(cx+ex,ey,er);
    ctx.fillStyle="#0a2012"; pupil(cx-ex+dir*2,ey,er); pupil(cx+ex+dir*2,ey,er);
    ctx.fillStyle="rgba(255,255,255,.95)"; ctx.beginPath(); ctx.arc(cx-ex+dir*2-1,ey-1,er*0.24,0,7); ctx.arc(cx+ex+dir*2-1,ey-1,er*0.24,0,7); ctx.fill(); }
  else { ctx.strokeStyle="#0a2012"; ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(cx-ex-er,ey);ctx.lineTo(cx-ex+er,ey);ctx.moveTo(cx+ex-er,ey);ctx.lineTo(cx+ex+er,ey);ctx.stroke(); }
  function eye(px,py,rr){ ctx.beginPath(); ctx.arc(px,py,rr,0,7); ctx.fill(); }
  function pupil(px,py,rr){ ctx.beginPath(); ctx.arc(px,py,rr*0.52,0,7); ctx.fill(); }
}
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

// ==========================================================================
// PARTÍCULAS / SOM / HUD / OVERLAY / DICA
// ==========================================================================
function burst(x,y,n,color,speed){ for(let i=0;i<n;i++){ const a=Math.random()*6.28,s=speed*(0.4+Math.random()*0.7);
  particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-speed*0.4,life:0.5+Math.random()*0.35,max:0.85,r:2+Math.random()*2.4,color}); }
  if(particles.length>320)particles.splice(0,particles.length-320); }
// ESPATIFO: gotas grandes e gosmentas voando pra fora (usado na morte / queda dura)
const SLIMECOL=["#8bec7c","#5ec84a","#3f9636","#cdf5ab","#2f8f30"];
function splat(x,y,n,power){ for(let i=0;i<n;i++){ const a=Math.random()*6.28, s=power*(0.25+Math.random()*0.95);
  particles.push({x:x+(Math.random()*2-1)*6, y:y+(Math.random()*2-1)*4,
    vx:Math.cos(a)*s, vy:Math.sin(a)*s - power*0.55,
    life:0.5+Math.random()*0.6, max:1.1, r:3+Math.random()*5, color:SLIMECOL[(Math.random()*SLIMECOL.length)|0] }); }
  if(particles.length>380)particles.splice(0,particles.length-380); }
// SEPARAÇÃO: gotas de gosma esguichando pra CIMA quando um pedaço se desprende do jogador
function slimeSplit(x,y){ for(let i=0;i<9;i++){ const a=-Math.PI/2 + (Math.random()*2-1)*1.05, s=90+Math.random()*130;
  particles.push({x:x+(Math.random()*2-1)*7, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s,
    life:0.32+Math.random()*0.3, max:0.62, r:1.6+Math.random()*2.6, color:SLIMECOL[(Math.random()*3)|0] }); }
  if(particles.length>380)particles.splice(0,particles.length-380); }
// ONDA de choque anelar (pulo, pouso, impacto, mola). inward=true → colapsa pra dentro (reabsorção)
function ring(x,y,maxR,color,width,dur,inward){
  rings.push({x,y,r:inward?maxR:2,maxR,color:color||"126,224,107",width:width||3,life:dur||0.42,max:dur||0.42,inward:!!inward});
  if(rings.length>60)rings.shift(); }
function updateRings(dt){ for(let i=rings.length-1;i>=0;i--){ const r=rings[i]; r.life-=dt;
  if(r.life<=0){rings.splice(i,1);continue;} const t=1-r.life/r.max;
  r.r = r.inward ? Math.max(0,r.maxR*(1-t)) : r.maxR*(1-(1-t)*(1-t)); } }   // easeOut na expansão
// RASTRO de gosma: cópias que ficam pra trás e "derretem" (achatam) ao sumir, cara de slime
function pushTrail(){ trail.push({x:blob.x,y:blob.y,w:blob.w,h:blob.h,life:0.30,max:0.30,
  cling:blob.cling,melt:blob.melting}); if(trail.length>22)trail.shift(); }
function updateTrail(dt){ for(let i=trail.length-1;i>=0;i--){ trail[i].life-=dt; if(trail[i].life<=0)trail.splice(i,1); } }
// CONFETE de comemoração (vitória): partículas coloridas subindo e caindo
const CONFCOL=["#7ee06b","#ffd24a","#8be9ff","#ff8fae","#c9a6ff","#a6f08a"];
function confetti(x,y,n){ for(let i=0;i<n;i++){ const a=Math.random()*6.28, s=140+Math.random()*220;
  particles.push({x:x+(Math.random()*2-1)*30,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-260,life:1.1+Math.random()*0.9,max:2.0,r:2+Math.random()*3,color:CONFCOL[i%CONFCOL.length]}); }
  if(particles.length>360)particles.splice(0,particles.length-360); }
function updateParticles(dt){ for(let i=particles.length-1;i>=0;i--){ const p=particles[i];
  p.vy+=620*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; if(p.life<=0)particles.splice(i,1); } }

let actx=null, master=null;
// barramento MESTRE: TODO o áudio (música + efeitos) passa por aqui, então o mudo silencia tudo
function ensureMaster(a){ if(!master && a){ master=a.createGain(); master.gain.value = musicOn?1:0; master.connect(a.destination); } return master; }
function busOut(a){ return master || a.destination; }
// ---- amostras de áudio (arquivos .mp3): pulo e impacto de slime ----
const SFXBUF={}, SFXSRC={jump:"sfx-jump.mp3", impact:"sfx-impact.mp3"};
let sfxLoaded=false;
function loadSamples(a){ if(sfxLoaded||!a)return; sfxLoaded=true;
  for(const k in SFXSRC){ fetch(SFXSRC[k]).then(r=>r.arrayBuffer())
    .then(buf=>new Promise((res,rej)=>a.decodeAudioData(buf,res,rej)))
    .then(dec=>{ SFXBUF[k]=dec; }).catch(e=>{}); } }
function sample(name, vol){ const a=actx; if(!a||!SFXBUF[name])return false;
  try{ const s=a.createBufferSource(); s.buffer=SFXBUF[name];
    const g=a.createGain(); g.gain.value=vol==null?0.7:vol; s.connect(g); g.connect(busOut(a)); s.start();
    return true; }catch(e){ return false; } }
function audio(){ if(!actx){ try{ actx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(actx){ if(actx.state==="suspended")actx.resume(); ensureMaster(actx); loadSamples(actx); loadBgm(actx); } return actx; }
function beep(a,f,t,d,ty,v){ const o=a.createOscillator(),g=a.createGain(); o.connect(g);g.connect(busOut(a));
  o.type=ty||"triangle"; o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(v||0.06,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.start(t);o.stop(t+d+0.02); }
function slideT(a,f0,f1,t,d,ty,v){ const o=a.createOscillator(),g=a.createGain(); o.connect(g);g.connect(busOut(a));
  o.type=ty||"square"; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+d);
  g.gain.setValueAtTime(v||0.06,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.start(t);o.stop(t+d+0.02); }
function sfx(type){ const a=actx; if(!a)return; const t=a.currentTime;
  // amostras reais têm prioridade (com fallback sintetizado)
  if(type==="jump"){ if(sample("jump",0.55))return; }
  if(type==="impact"){ if(sample("impact",0.8))return; slideT(a,180,50,t,0.5,"sawtooth",0.07); return; }
  switch(type){ case"jump":slideT(a,520,300,t,0.12,"square",0.05);break;
    case"absorb":slideT(a,300,660,t,0.16,"sine",0.06); beep(a,1180,t+0.09,0.08,"sine",0.03);break;   // sugada gosmenta + brilho
    case"pickup":beep(a,720,t,0.09,"sine",0.06); beep(a,1040,t+0.05,0.10,"sine",0.05);break;          // "blup" macio de bolha
    case"melt":slideT(a,220,150,t,0.10,"sawtooth",0.035);break;
    case"nope":slideT(a,190,120,t,0.11,"triangle",0.045);break;                                       // recusa mais suave
    case"die":slideT(a,220,60,t,0.40,"sawtooth",0.06);break;
    case"spring":slideT(a,320,1000,t,0.18,"sine",0.06); beep(a,1320,t+0.11,0.08,"sine",0.03);break;    // boing + ping
    case"spit":slideT(a,440,150,t,0.2,"sawtooth",0.05);break;                                          // cuspe do chefe
    case"gem":[880,1180,1560].forEach((f,i)=>beep(a,f,t+i*0.06,0.09,"sine",0.05));break;
    case"star":[988,1319,1760].forEach((f,i)=>beep(a,f,t+i*0.05,0.10,"triangle",0.05));break;          // faísca de 3 notas
    case"secret":[523,659,880,1319].forEach((f,i)=>beep(a,f,t+i*0.10,0.16,"sine",0.055));break;   // acorde misterioso
    case"win":[523,659,784,1046].forEach((f,i)=>beep(a,f,t+i*0.09,0.10,"triangle",0.06));break;
    case"boss":[110,98,82].forEach((f,i)=>slideT(a,f,f*0.6,t+i*0.13,0.5,"sawtooth",0.05));break;   // rugido grave
    case"swap":[660,990,1320].forEach((f,i)=>beep(a,f,t+i*0.04,0.08,"sine",0.05));break;              // troca de corpo (whoosh)
    case"land":slideT(a,200,90,t,0.09,"sine",0.045);break;                                            // baque ao pousar
    case"bosshit":[200,300,140].forEach((f,i)=>slideT(a,f*2,f,t+i*0.05,0.14,"square",0.06));break;     // acerto no chefe
    case"hurt":slideT(a,320,120,t,0.18,"sawtooth",0.05);break; } }                                     // levou dano

// ---------------------------------------------------------------- MÚSICA AMBIENTE
let musicOn = true; try{ musicOn = localStorage.getItem("geleca_music")!=="0"; }catch(e){}
let mus=null;
// MUNDO 1 (Vale) — trilha em ARQUIVO (loop). Demais mundos usam a música sintetizada abaixo.
const BGM_THEMES=new Set(["grove"]);          // temas que usam a trilha de arquivo
let bgmBuf=null, bgmLoading=false, pendingBgm=false;
function loadBgm(a){ if(bgmBuf||bgmLoading||!a)return; bgmLoading=true;
  fetch("music-vale.mp3").then(r=>r.arrayBuffer())
    .then(buf=>new Promise((res,rej)=>a.decodeAudioData(buf,res,rej)))
    .then(dec=>{ bgmBuf=dec; bgmLoading=false; if(pendingBgm && musicOn) startBgm(); })
    .catch(e=>{ bgmLoading=false; }); }
function startBgm(){ const a=audio(); if(!a||!bgmBuf) return; stopMusic(); pendingBgm=true;
  const src=a.createBufferSource(); src.buffer=bgmBuf; src.loop=true;
  const g=a.createGain(); g.gain.value=0.42;                 // volume da trilha (ajustável)
  src.connect(g); g.connect(busOut(a)); src.start();
  mus={bgm:src, g}; }
const MUSIC={
  grove: { root:130.81, wave:"triangle", scale:[0,2,4,7,9],  tempo:600, pat:[0,2,4,2,4,3,2,0] }, // MUNDO 1: dó maior, acolhedor
  cave:  { root:130.81, wave:"triangle", scale:[0,3,5,7,10], tempo:660, pat:[0,2,3,2,4,3,2,1] },
  deep:  { root:98.00,  wave:"sine",     scale:[0,2,3,7,8],  tempo:780, pat:[0,1,2,3,2,1,0,2] },
  forge: { root:110.00, wave:"sawtooth", scale:[0,3,5,6,7],  tempo:520, pat:[0,2,4,3,2,4,1,0] },
  ice:   { root:146.83, wave:"triangle", scale:[0,2,4,7,9],  tempo:700, pat:[4,2,0,2,4,3,2,0] },
  void:  { root:73.42,  wave:"sine",     scale:[0,1,5,6,8],  tempo:900, pat:[0,2,1,3,2,4,1,0] },
};
function startMusic(themeName){
  const a=audio(); if(!a) return; stopMusic();
  // MUNDO 1: toca a trilha de arquivo (loop). Se ainda não decodificou, começa assim que carregar.
  if(BGM_THEMES.has(themeName)){ pendingBgm=true; if(bgmBuf) startBgm(); else loadBgm(a); return; }
  const cfg=MUSIC[themeName]||MUSIC.grove;
  const g=a.createGain(); g.gain.value = 0.06;                 // mudo é controlado pelo barramento MESTRE
  const lp=a.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=1750; lp.Q.value=0.6;  // calor
  g.connect(lp); lp.connect(busOut(a));
  const oscs=[];
  // PAD: sub-oitava quente + tônica + quinta + oitava + brilho leve
  [[0.5,0.12,"sine"],[1,0.28,"sine"],[1.5,0.15,"sine"],[2,0.10,"triangle"],[3,0.045,"sine"]].forEach(([mul,vol,ty])=>{
    const o=a.createOscillator(), pg=a.createGain(); o.type=ty; o.frequency.value=cfg.root*mul; pg.gain.value=vol;
    o.connect(pg); pg.connect(g); o.start(); oscs.push(o); });
  const scale=cfg.scale, pat=cfg.pat||[0,2,4,2], barMs=cfg.tempo*4/1000;
  let step=0;
  const timer=setInterval(()=>{ if(!actx||actx.state!=="running"||!musicOn)return;
    const t=actx.currentTime;
    if(step%4===0){                                                    // BAIXO (a cada compasso)
      const bf=cfg.root*0.5*Math.pow(2, scale[(step/4)%scale.length]/12);
      const bo=actx.createOscillator(), bg=actx.createGain(); bo.type="sine"; bo.frequency.value=bf;
      bg.gain.setValueAtTime(0.0001,t); bg.gain.exponentialRampToValueAtTime(0.28,t+0.05); bg.gain.exponentialRampToValueAtTime(0.0001,t+barMs);
      bo.connect(bg); bg.connect(g); bo.start(t); bo.stop(t+barMs+0.05);
    }
    const semi=scale[pat[step%pat.length]%scale.length], oct=(step%16<8)?1:2;   // MELODIA (padrão musical)
    const f=cfg.root*oct*Math.pow(2,semi/12);
    const o=actx.createOscillator(), ng=actx.createGain(); o.type=cfg.wave; o.frequency.value=f;
    ng.gain.setValueAtTime(0.0001,t); ng.gain.exponentialRampToValueAtTime(0.16,t+0.04); ng.gain.exponentialRampToValueAtTime(0.0001,t+0.5);
    o.connect(ng); ng.connect(g); o.start(t); o.stop(t+0.55);
    if(step%2===1){                                                    // FAÍSCA: brilho alto e suave nas contratempos
      const ssemi=scale[pat[(step+2)%pat.length]%scale.length];
      const sf=cfg.root*4*Math.pow(2,ssemi/12);
      const so=actx.createOscillator(), sg=actx.createGain(); so.type="sine"; so.frequency.value=sf;
      sg.gain.setValueAtTime(0.0001,t); sg.gain.exponentialRampToValueAtTime(0.04,t+0.02); sg.gain.exponentialRampToValueAtTime(0.0001,t+0.28);
      so.connect(sg); sg.connect(g); so.start(t); so.stop(t+0.3);
    }
    step++;
  }, cfg.tempo);
  mus={g, lp, oscs, timer};
}
function stopMusic(){ pendingBgm=false; if(!mus)return;
  if(mus.timer) clearInterval(mus.timer);
  if(mus.oscs) mus.oscs.forEach(o=>{ try{o.stop();}catch(e){} });
  if(mus.bgm){ try{mus.bgm.stop();}catch(e){} }
  try{mus.g&&mus.g.disconnect();}catch(e){} try{mus.lp&&mus.lp.disconnect();}catch(e){}
  mus=null; }
function toggleMute(){ musicOn=!musicOn; try{localStorage.setItem("geleca_music",musicOn?"1":"0");}catch(e){}
  // o MESTRE silencia TUDO (música + efeitos), com fade curtinho pra não estalar
  if(master && actx){ const t=actx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(musicOn?1:0, t, 0.02); }
  const btn=el("btn-mute"); if(btn) btn.textContent=musicOn?"🔊":"🔇";
  if(musicOn && !mus && state==="play" && level) startMusic(level.theme); }

function renderHud(){ el("level-name").textContent=level.name;
  const p=el("mass-pips"); p.innerHTML="";
  for(let i=0;i<level.max;i++){ const d=document.createElement("span"); d.className="pip"+(i<blob.mass?"":" empty"); p.appendChild(d); } }
function overlay(title,msg,btns,stars){ const o=el("overlay");
  o.innerHTML=`<h2>${title}</h2>${stars?`<div class="stars">${msg}</div>`:`<p>${msg}</p>`}<div class="row"></div>`;
  const row=o.querySelector(".row");
  btns.forEach(b=>{ const el2=document.createElement("button"); el2.textContent=b.t; if(b.ghost)el2.className="ghost";
    el2.addEventListener("click",()=>{audio();b.cb();}); row.appendChild(el2); });
  o.classList.remove("hidden"); }
function hideOverlay(){ el("overlay").classList.add("hidden"); }
// SEM DICAS DE TEXTO: o jogo é um puzzle — o jogador descobre tudo sozinho.
let hintTimer; function showHint(t){ const e=el("hint"); if(e){ e.textContent=""; e.classList.remove("show"); } }
function hideHint(){ const e=el("hint"); if(e)e.classList.remove("show"); clearTimeout(hintTimer); }

// ==========================================================================
// LOOP
// ==========================================================================
function loop(ts){ const dt=Math.min(0.033,(ts-last)/1000||0); last=ts; update(dt);
  // AUTOPILOT: se empacou (sem progresso rumo à saída por ~9s), pula pra próxima fase
  if(botOn && state==="play" && bot.progT>9){ bot.progT=0; bot.bestD=null;
    const N=LEVELS.filter(L=>!L.secret).length; startGame(levelIndex+1<N?levelIndex+1:0); }
  // durante a comemoração/morte o jogo pausa, mas partículas e o tremor continuam vivos
  if(state==="complete"||state==="dead"){ updateParticles(dt); updateRings(dt); updateTrail(dt); T+=dt; if(shake>0)shake=Math.max(0,shake-dt*24);
    if(winTimer>0){ winTimer-=dt; if(winTimer<=0&&winThen){ const f=winThen; winThen=null; f(); } }
    // AUTOPILOT: encadeia a demonstração — avança na vitória, repete na morte
    if(botOn){ botWait+=dt; if(botWait>1.3){ botWait=0;
      if(state==="complete"){ const NORMAL=LEVELS.filter(L=>!L.secret).length; startGame(levelIndex+1<NORMAL?levelIndex+1:0); }
      else resetLevel(); } } }
  if(state!=="menu" && state!=="editor") render(); requestAnimationFrame(loop); }
let winTimer=0, winThen=null;
function deferWin(fn,delay){ winThen=fn; winTimer=delay; }

// ==========================================================================
// ENTRADA (teclado + joystick + botões)
// ==========================================================================
const KEYMAP={ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",ArrowDown:"down",KeyS:"down"};
const JUMPK={Space:1,ArrowUp:1,KeyW:1};
window.addEventListener("keydown",e=>{ if(e.repeat)return; audio();
  if(JUMPK[e.code]){e.preventDefault();jumpEdge=true;return;}
  if(e.code==="KeyE"){grabEdge=true;return;}
  if(e.code==="KeyR"){ if(state==="play"||state==="dead")resetLevel(); return; }
  if(e.code==="KeyM"){ toggleMute(); return; }
  if(e.code==="KeyB"){ toggleBot(); return; }             // liga/desliga o AUTOPILOT
  if(e.code==="Escape"){ if(state!=="menu")showMenu(); return; }
  const k=KEYMAP[e.code]; if(k){e.preventDefault();IN.kb[k]=true;} });
window.addEventListener("keyup",e=>{ const k=KEYMAP[e.code]; if(k)IN.kb[k]=false; });
let rzT; window.addEventListener("resize",()=>{ clearTimeout(rzT); rzT=setTimeout(()=>{ if(state!=="menu"){ fitCanvas(); camFollow(true); } },120); });

// joystick
const stick=el("stick"), knob=el("knob"); let stickId=null,scx=0,scy=0; const SR=48;
function stickSet(cx,cy){ let dx=cx-scx,dy=cy-scy; const d=Math.hypot(dx,dy); if(d>SR){dx=dx/d*SR;dy=dy/d*SR;}
  knob.style.transform=`translate(${dx}px,${dy}px)`; IN.joyX=dx/SR; IN.joyY=dy/SR; }
function stickReset(){ stickId=null; IN.joyX=0;IN.joyY=0; knob.style.transform="translate(0,0)"; }
function centerFrom(){ const r=stick.getBoundingClientRect(); scx=r.left+r.width/2; scy=r.top+r.height/2; }
stick.addEventListener("touchstart",e=>{ e.preventDefault(); audio(); centerFrom();
  const t=e.changedTouches[0]; stickId=t.identifier; stickSet(t.clientX,t.clientY); },{passive:false});
stick.addEventListener("touchmove",e=>{ e.preventDefault(); for(const t of e.touches)if(t.identifier===stickId){stickSet(t.clientX,t.clientY);return;} },{passive:false});
stick.addEventListener("touchend",e=>{ e.preventDefault(); for(const t of e.changedTouches)if(t.identifier===stickId){stickReset();return;} },{passive:false});
stick.addEventListener("touchcancel",e=>{ stickReset(); },{passive:false});
stick.addEventListener("mousedown",e=>{ e.preventDefault(); audio(); centerFrom(); stickId="m"; stickSet(e.clientX,e.clientY);
  const mv=ev=>stickSet(ev.clientX,ev.clientY), up=()=>{stickReset();window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
  window.addEventListener("mousemove",mv); window.addEventListener("mouseup",up); });

// botões de ação
function bindAct(id,fn){ const b=el(id);
  const d=e=>{e.preventDefault();audio();fn();};
  b.addEventListener("touchstart",d,{passive:false}); b.addEventListener("mousedown",d); }
bindAct("btn-jump",()=>{ jumpEdge=true; });
bindAct("btn-grab",()=>{ grabEdge=true; });
el("btn-reset").addEventListener("click",()=>{ if(state==="play"||state==="dead")resetLevel(); });
el("btn-menu").addEventListener("click",()=>{ if(customCtx==='edit')showEditor(false); else if(customCtx==='list')showCustom(); else showMenu(); });
el("btn-mute").addEventListener("click",()=>{ audio(); toggleMute(); });
el("btn-bot").addEventListener("click",()=>{ audio(); toggleBot(); });
{ const mb=el("btn-mute"); if(mb) mb.textContent = musicOn?"🔊":"🔇"; }   // reflete estado salvo

// SEGREDO: tocar/clicar numa geleca solta (área do jogo, fora do joystick/botões) TROCA de corpo.
canvas.addEventListener("pointerdown",e=>{ if(state!=="play")return; audio(); tryPossess(e.clientX,e.clientY); });

// ==========================================================================
// EDITOR DE FASES (estilo Mario Maker) + MINHAS FASES
// ==========================================================================
const CUSTOM_KEY="geleca_custom_v1";
function loadCustom(){ try{ return JSON.parse(localStorage.getItem(CUSTOM_KEY)||"{}"); }catch(e){ return {}; } }
function saveCustom(o){ try{ localStorage.setItem(CUSTOM_KEY, JSON.stringify(o)); }catch(e){} }
// paleta de pincéis do editor
const PALETTE=[
  {b:'#',      ic:'🟫', lbl:'Chão',    col:'#6a4a2a'},
  {b:'^',      ic:'🔺', lbl:'Espinho', col:'#c02a34'},
  {b:'o',      ic:'🟢', lbl:'Gosma',   col:'#2f7a30'},
  {b:'*',      ic:'⭐', lbl:'Estrela',  col:'#c99320'},
  {b:'T',      ic:'🔷', lbl:'Mola',    col:'#2f7f9e'},
  {b:'C',      ic:'🟧', lbl:'Frágil',  col:'#a06a30'},
  {b:'H',      ic:'🔥', lbl:'Calor',   col:'#b0431f'},
  {b:'P',      ic:'🔘', lbl:'Placa',   col:'#35507f'},
  {b:'D',      ic:'🟪', lbl:'Porta',   col:'#5a3a8a'},
  {b:'G',      ic:'💎', lbl:'Gema',    col:'#8a5fd0'},
  {b:'falsa',  ic:'🧱', lbl:'Falsa',   col:'#4a5550'},
  {b:'patrol', ic:'🛡️', lbl:'Guardião',col:'#8a1830'},
  {b:'chaser', ic:'👻', lbl:'Caçador', col:'#5a1440'},
  {b:'mover',  ic:'↔️', lbl:'Móvel',   col:'#2f6f7f'},
  {b:'@',      ic:'🟩', lbl:'Início',  col:'#2f9838'},
  {b:'E',      ic:'🏁', lbl:'Saída',   col:'#1a2a3a'},
  {b:'erase',  ic:'🧽', lbl:'Apagar',  col:'#20302a'},
];
const PMAP={}; for(const it of PALETTE) PMAP[it.b]=it;
const ed={ W:48, H:18, grid:[], ents:[], brush:'#', cam:0, tile:24, editingSlot:null, pendingSlot:1, painting:false };
const edCanvas=el("ed-canvas"), edCtx=edCanvas?edCanvas.getContext("2d"):null;

function edBlankFake(){ ed.fake=[]; for(let y=0;y<ed.H;y++) ed.fake.push(new Array(ed.W).fill(false)); }
function edNew(){
  ed.W=48; ed.H=18;
  ed.grid=[]; for(let y=0;y<ed.H;y++){ const r=[]; for(let x=0;x<ed.W;x++) r.push((x===0||x===ed.W-1||y===0)?'#':' '); ed.grid.push(r); }
  for(let x=1;x<ed.W-1;x++){ ed.grid[ed.H-1][x]='#'; ed.grid[ed.H-2][x]='#'; }   // chão inicial
  ed.grid[ed.H-3][2]='@'; ed.grid[ed.H-3][ed.W-3]='E';
  edBlankFake();
  ed.ents=[]; ed.cam=0; ed.editingSlot=null;
  const c=loadCustom(); let s=1; while(c[s]) s++; ed.pendingSlot=s;
  if(el("ed-name")) el("ed-name").value=""; if(el("ed-mass")) el("ed-mass").value="8";
}
function edLoadObj(obj, slot){
  const r=obj.rows; ed.H=r.length; ed.W=r[0].length; ed.grid=r.map(l=>l.split(''));
  edBlankFake();
  // traduz paredes fantasma LEGADAS ('S' e 'g') pra CAMADA (overlay): 'S'→rocha vazia, 'g'→gema+rocha
  for(let y=0;y<ed.H;y++)for(let x=0;x<ed.W;x++){ const c=ed.grid[y][x];
    if(c==='S'){ ed.grid[y][x]=' '; ed.fake[y][x]=true; }
    else if(c==='g'){ ed.grid[y][x]='G'; ed.fake[y][x]=true; } }
  for(const f of (obj.fakes||[])){ if(ed.fake[f[1]]) ed.fake[f[1]][f[0]]=true; }
  ed.ents=[];
  for(const e of (obj.enemies||[])) ed.ents.push({x:e.x,y:e.y,kind:e.type==='chaser'?'chaser':'patrol',src:Object.assign({},e)});
  for(const m of (obj.movers||[])) ed.ents.push({x:m.x,y:m.y,kind:'mover',src:Object.assign({},m)});
  ed.cam=0;
  if(slot==null){ ed.editingSlot=null; const c=loadCustom(); let s=1; while(c[s]) s++; ed.pendingSlot=s; }
  else { ed.editingSlot=slot; ed.pendingSlot=slot; }
  el("ed-name").value=(obj.name||"").replace(/^\d+\s*·\s*/,''); el("ed-mass").value=obj.mass;
}
function edBuild(){
  const rows=ed.grid.map(r=>r.join('')); const enemies=[], movers=[];
  for(const e of ed.ents){
    if(e.kind==='patrol') enemies.push(e.src?Object.assign({},e.src,{x:e.x,y:e.y,type:'patrol'}):{x:e.x,y:e.y,dist:4,speed:1.0,axis:'x',type:'patrol'});
    else if(e.kind==='chaser') enemies.push(e.src?Object.assign({},e.src,{x:e.x,y:e.y,type:'chaser'}):{x:e.x,y:e.y,speed:1.15,type:'chaser',range:8});
    else if(e.kind==='mover') movers.push(e.src?Object.assign({},e.src,{x:e.x,y:e.y}):{x:e.x,y:e.y,w:3,dist:6,axis:'x',speed:0.6,phase:0});
  }
  const fakes=[]; for(let y=0;y<ed.H;y++)for(let x=0;x<ed.W;x++) if(ed.fake[y]&&ed.fake[y][x]) fakes.push([x,y]);
  const mass=Math.max(1,Math.min(20, parseInt(el("ed-mass").value)||8));
  const nm=(el("ed-name").value||"Sem nome").trim();
  const slot=parseInt(el("ed-slot").value)||1;
  const obj={ name:slot+" · "+nm, mass, max:mass, theme:"grove", hint:"", rows };
  if(enemies.length) obj.enemies=enemies; if(movers.length) obj.movers=movers; if(fakes.length) obj.fakes=fakes;
  return {obj, slot};
}
function edValidate(rows){ const flat=rows.join('');
  const a=(flat.match(/@/g)||[]).length, e=(flat.match(/E/g)||[]).length;
  if(a!==1) return "Coloque exatamente 1 início 🟩 (tem "+a+")";
  if(e!==1) return "Coloque exatamente 1 saída 🏁 (tem "+e+")";
  return null;
}
function edSave(){ const {obj,slot}=edBuild(); const err=edValidate(obj.rows);
  if(err){ el("ed-hint").textContent="⚠ "+err; return false; }
  const c=loadCustom();
  if(ed.editingSlot!=null && ed.editingSlot!==slot) delete c[ed.editingSlot];
  c[slot]=obj; saveCustom(c); ed.editingSlot=slot;
  const NORMAL=LEVELS.filter(L=>!L.secret).length;
  el("ed-hint").textContent = slot<=NORMAL ? ("💾 Salvo! A Fase "+slot+" no mapa agora é a SUA versão.") : ("💾 Salvo como Fase "+slot+"!");
  return true; }
function edTest(){ const {obj}=edBuild(); const err=edValidate(obj.rows);
  if(err){ el("ed-hint").textContent="⚠ "+err; return; }
  playLevelObj(obj,'edit'); }

function edFit(){ const st=el("ed-stage"); if(!st||!edCanvas) return;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  edCanvas.width=Math.max(1,Math.round(st.clientWidth*dpr));
  edCanvas.height=Math.max(1,Math.round(st.clientHeight*dpr));
  ed.tile=Math.max(10, Math.floor(edCanvas.height/ed.H)); }
function edDrawCell(px,py,t,ch){
  const it=PMAP[ch]; const col=it?it.col:'#556';
  edCtx.fillStyle=col; edCtx.fillRect(px+1,py+1,t-2,t-2);
  if(ch==='S'||ch==='g'){ edCtx.strokeStyle="rgba(255,255,255,.25)"; edCtx.strokeRect(px+2.5,py+2.5,t-5,t-5); }
  edCtx.font=Math.floor(t*0.62)+"px sans-serif"; edCtx.textAlign="center"; edCtx.textBaseline="middle";
  edCtx.fillText(it?it.ic:'?', px+t/2, py+t/2+1);
}
function edDrawEnt(px,py,t,kind){ const it=PMAP[kind];
  edCtx.font=Math.floor(t*0.7)+"px sans-serif"; edCtx.textAlign="center"; edCtx.textBaseline="middle";
  edCtx.fillText(it?it.ic:'?', px+t/2, py+t/2+1); }
function edRender(){ if(!edCtx) return; const t=ed.tile, cw=edCanvas.width, ch=edCanvas.height;
  edCtx.fillStyle="#0c1a13"; edCtx.fillRect(0,0,cw,ch);
  const viewCols=Math.floor(cw/t); ed.cam=Math.max(0, Math.min(ed.cam, Math.max(0, ed.W-viewCols)));
  for(let sx=0; sx<=viewCols; sx++){ const gx=ed.cam+sx; if(gx>=ed.W) break;
    for(let gy=0; gy<ed.H; gy++){ const px=sx*t, py=gy*t;
      edCtx.strokeStyle="rgba(255,255,255,.05)"; edCtx.strokeRect(px,py,t,t);
      const c=ed.grid[gy][gx]; if(c && c!==' ') edDrawCell(px,py,t,c);
      if(ed.fake[gy]&&ed.fake[gy][gx]){                                  // CAMADA parede falsa (translúcida no editor)
        edCtx.fillStyle="rgba(74,85,80,.6)"; edCtx.fillRect(px+1,py+1,t-2,t-2);
        edCtx.strokeStyle="rgba(210,210,220,.55)"; edCtx.setLineDash([4,3]); edCtx.strokeRect(px+2.5,py+2.5,t-5,t-5); edCtx.setLineDash([]);
        edCtx.font=Math.floor(t*0.34)+"px sans-serif"; edCtx.textAlign="right"; edCtx.textBaseline="top"; edCtx.fillText('🧱',px+t-2,py+1);
      }
    } }
  for(const e of ed.ents){ if(e.x<ed.cam) continue; const sx=e.x-ed.cam; if(sx>viewCols) continue; edDrawEnt(sx*t,e.y*t,t,e.kind); }
}
function edCell(ev){ const r=edCanvas.getBoundingClientRect();
  const sx=(ev.clientX-r.left)/r.width*edCanvas.width, sy=(ev.clientY-r.top)/r.height*edCanvas.height;
  return { gx:ed.cam+Math.floor(sx/ed.tile), gy:Math.floor(sy/ed.tile) }; }
function edApply(gx,gy){ if(gx<0||gx>=ed.W||gy<0||gy>=ed.H) return; const b=ed.brush;
  if(b==='erase'){ ed.grid[gy][gx]=' '; if(ed.fake[gy])ed.fake[gy][gx]=false; ed.ents=ed.ents.filter(e=>!(e.x===gx&&e.y===gy)); }
  else if(b==='falsa'){ if(ed.fake[gy]) ed.fake[gy][gx]=true; }                 // CAMADA: cobre a célula SEM apagar o que há atrás
  else if(b==='patrol'||b==='chaser'||b==='mover'){ ed.ents=ed.ents.filter(e=>!(e.x===gx&&e.y===gy)); ed.ents.push({x:gx,y:gy,kind:b}); }
  else if(b==='@'||b==='E'){ for(let y=0;y<ed.H;y++)for(let x=0;x<ed.W;x++) if(ed.grid[y][x]===b) ed.grid[y][x]=' '; ed.grid[gy][gx]=b; }
  else { ed.grid[gy][gx]=b; }
  edRender();
}
function edBuildPalette(){ const p=el("ed-palette"); if(!p) return; p.innerHTML="";
  for(const it of PALETTE){ const btn=document.createElement("button"); btn.className="pal-btn"+(it.b===ed.brush?" sel":"");
    btn.innerHTML=`<span>${it.ic}</span><span class="pl-lbl">${it.lbl}</span>`;
    btn.addEventListener("click",()=>{ ed.brush=it.b; edBuildPalette(); el("ed-hint").textContent="Pincel: "+it.lbl; });
    p.appendChild(btn); } }
function edBuildSlots(){ const s=el("ed-slot"); if(!s) return; s.innerHTML="";
  for(let i=1;i<=20;i++){ const o=document.createElement("option"); o.value=i; o.textContent=i; s.appendChild(o); } }
function showEditor(fresh){ state="editor"; customCtx=null;
  ["screen-menu","screen-custom","screen-game"].forEach(id=>el(id).classList.remove("active"));
  el("screen-editor").classList.add("active");
  if(fresh) edNew();
  edBuildSlots(); edBuildPalette();
  el("ed-slot").value = ed.editingSlot!=null ? ed.editingSlot : ed.pendingSlot;
  requestAnimationFrame(()=>{ edFit(); edRender(); });
}
function showCustom(){ state="menu"; customCtx=null;
  ["screen-menu","screen-editor","screen-game"].forEach(id=>el(id).classList.remove("active"));
  el("screen-custom").classList.add("active"); buildCustomList();
}
function buildCustomList(){ const box=el("custom-list"); if(!box) return; box.innerHTML="";
  // ── SEÇÃO: editar uma FASE OFICIAL como base ──
  const NORMAL=LEVELS.filter(L=>!L.secret).length;
  const oh=document.createElement("div"); oh.className="cl-section"; oh.textContent="✏️ Editar uma fase oficial (vira base pra alterar)";
  box.appendChild(oh);
  const orow=document.createElement("div"); orow.className="cl-officials";
  const cAll=loadCustom();
  for(let i=0;i<NORMAL;i++){ const btn=document.createElement("button"); btn.className="cl-off"+(cAll[i+1]?" customized":""); btn.textContent=(i+1);
    btn.title=LEVELS[i].name+(cAll[i+1]?" (você já editou)":"");
    // edita a oficial i: o slot JÁ vem como Fase i+1, então salvar SUBSTITUI aquela fase no mapa
    btn.addEventListener("click",()=>{ audio(); const c=loadCustom(); edLoadObj(c[i+1]||LEVELS[i], null); ed.pendingSlot=i+1; ed.editingSlot=(c[i+1]?i+1:null); showEditor(false); });
    orow.appendChild(btn); }
  box.appendChild(orow);
  // ── SEÇÃO: minhas fases ──
  const mh=document.createElement("div"); mh.className="cl-section"; mh.textContent="🛠️ Minhas fases";
  box.appendChild(mh);
  const c=loadCustom(); const slots=Object.keys(c).map(Number).sort((a,b)=>a-b);
  if(!slots.length){ const e=document.createElement("div"); e.className="cl-empty";
    e.innerHTML="Nenhuma fase criada ainda.<br>Toque em ➕ Nova, ou edite uma oficial acima."; box.appendChild(e); return; }
  for(const s of slots){ const o=c[s], nm=(o.name||"").replace(/^\d+\s*·\s*/,'')||"Sem nome";
    const card=document.createElement("div"); card.className="cl-card";
    card.innerHTML=`<div class="cl-num">${s}</div><div class="cl-info"><div class="cl-name">${nm}</div><div class="cl-sub">massa ${o.mass} · ${o.rows[0].length}×${o.rows.length}</div></div>`;
    const act=document.createElement("div"); act.className="cl-act";
    const play=document.createElement("button"); play.className="play"; play.textContent="▶";
    play.addEventListener("click",()=>{ audio(); playLevelObj(o,'list'); });
    const edit=document.createElement("button"); edit.textContent="✏️";
    edit.addEventListener("click",()=>{ audio(); edLoadObj(o,s); showEditor(false); });
    const del=document.createElement("button"); del.textContent="🗑️";
    del.addEventListener("click",()=>{ const cc=loadCustom(); delete cc[s]; saveCustom(cc); buildCustomList(); });
    act.appendChild(play); act.appendChild(edit); act.appendChild(del); card.appendChild(act); box.appendChild(card);
  }
}
// wiring do editor
if(el("btn-open-custom")) el("btn-open-custom").addEventListener("click",()=>{ audio(); showCustom(); });
if(el("btn-water-proto")) el("btn-water-proto").addEventListener("click",()=>{ audio(); playLevelObj(WATER_PROTO,'proto'); });
if(el("btn-custom-back")) el("btn-custom-back").addEventListener("click",showMenu);
if(el("btn-new-level")) el("btn-new-level").addEventListener("click",()=>{ audio(); showEditor(true); });
if(el("ed-back")) el("ed-back").addEventListener("click",showCustom);
if(el("ed-test")) el("ed-test").addEventListener("click",()=>{ audio(); edTest(); });
if(el("ed-save")) el("ed-save").addEventListener("click",()=>{ audio(); edSave(); });
if(el("ed-left")) el("ed-left").addEventListener("click",()=>{ ed.cam=Math.max(0,ed.cam-6); edRender(); });
if(el("ed-right")) el("ed-right").addEventListener("click",()=>{ ed.cam+=6; edRender(); });
if(edCanvas){
  edCanvas.addEventListener("pointerdown",e=>{ e.preventDefault(); ed.painting=true; const {gx,gy}=edCell(e); edApply(gx,gy); });
  edCanvas.addEventListener("pointermove",e=>{ if(!ed.painting)return; const {gx,gy}=edCell(e); edApply(gx,gy); });
  window.addEventListener("pointerup",()=>{ ed.painting=false; });
}
window.addEventListener("resize",()=>{ if(state==="editor"){ edFit(); edRender(); } });

// ── EXPORTAR / IMPORTAR — pra tornar fases PERMANENTES: exporte o código e me mande no chat ──
function showIO(mode, code){
  const m=el("io-modal");
  el("io-title").textContent = mode==='export'?"📤 Exportar fase(s)":"📥 Importar fase(s)";
  el("io-note").textContent = mode==='export'
    ? "Copie este código e cole no chat — eu gravo PERMANENTE nos arquivos do jogo. (Serve também de backup / passar de aparelho.)"
    : "Cole aqui um código de fase(s) e toque em Importar.";
  const ta=el("io-text"); ta.value=code||""; ta.readOnly=(mode==='export');
  el("io-copy").style.display = mode==='export'?"":"none";
  el("io-do").style.display   = mode==='import'?"":"none";
  m.classList.remove("hidden"); if(mode==='import') ta.focus();
}
function hideIO(){ el("io-modal").classList.add("hidden"); }
function exportCurrent(){ const {obj,slot}=edBuild(); const err=edValidate(obj.rows);
  if(err){ el("ed-hint").textContent="⚠ "+err; return; }
  showIO('export', JSON.stringify({[slot]:obj})); }
function exportAll(){ const c=loadCustom();
  showIO('export', Object.keys(c).length?JSON.stringify(c):"(nenhuma fase criada ainda)"); }
function doImport(){ const t=el("io-text").value.trim(); let data=null;
  try{ data=JSON.parse(t); }catch(e){ el("io-note").textContent="⚠ Código inválido (não é JSON)."; return; }
  const c=loadCustom(); let n=0;
  if(data && data.rows){ const mn=(data.name||"").match(/^(\d+)/); let s=mn?parseInt(mn[1]):1; while(!mn&&c[s])s++; c[s]=data; n=1; }
  else if(data && typeof data==='object'){ for(const k of Object.keys(data)){ if(data[k]&&data[k].rows){ c[k]=data[k]; n++; } } }
  if(!n){ el("io-note").textContent="⚠ Nenhuma fase encontrada no código."; return; }
  saveCustom(c); hideIO(); buildCustomList(); }
function copyIO(){ const ta=el("io-text"); ta.select(); ta.setSelectionRange(0,999999);
  const done=()=>{ el("io-copy").textContent="✓ Copiado"; setTimeout(()=>el("io-copy").textContent="📋 Copiar",1500); };
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(ta.value).then(done).catch(()=>{ try{document.execCommand('copy');done();}catch(e){} }); }
  else { try{document.execCommand('copy');done();}catch(e){} } }
if(el("ed-export")) el("ed-export").addEventListener("click",()=>{ audio(); exportCurrent(); });
if(el("btn-export-all")) el("btn-export-all").addEventListener("click",()=>{ audio(); exportAll(); });
if(el("btn-import")) el("btn-import").addEventListener("click",()=>{ audio(); showIO('import',''); });
if(el("io-copy")) el("io-copy").addEventListener("click",copyIO);
if(el("io-do")) el("io-do").addEventListener("click",doImport);
if(el("io-close")) el("io-close").addEventListener("click",hideIO);

// ==========================================================================
// BOOT
// ==========================================================================
edNew();
showMenu();
requestAnimationFrame(loop);

// exposto p/ testes
window.G={ get state(){return state;}, get mass(){return blob?blob.mass:0;}, get globs(){return globs?globs.length:0;},
  get level(){return levelIndex;}, get blob(){return blob;}, get melting(){return !!(blob&&blob.melting);},
  get doorOpen(){return plateOn();}, start:startGame, menu:showMenu,
  get gems(){return gems?gems.length:0;}, get gemsGot(){return gems?gems.filter(g=>g.got).length:0;},
  get stars(){return stars?stars.length:0;}, get starsGot(){return stars?stars.filter(s=>s.got).length:0;},
  get enemies(){return enemies?enemies.length:0;}, get chasers(){return enemies?enemies.filter(e=>e.type==="chaser").length:0;},
  get fakes(){return fakes?fakes.length:0;}, get crumbles(){return crumbles?crumbles.length:0;},
  get pickups(){return pickups?pickups.length:0;}, get boss(){return enemies?enemies.filter(e=>e.type==="boss").length:0;},
  gemPos(){ const gm=gems&&gems.find(g=>!g.got); return gm?{x:gm.x,y:gm.y,rev:gm.rev}:null; },
  gemRev(){ const gm=gems&&gems.find(g=>!g.got); return gm?gm.rev:-1; },
  reset(){ resetLevel(); },
  get music(){ return !!mus; }, get muted(){ return !musicOn; }, muteToggle(){ toggleMute(); },
  enX(i){ return enemies&&enemies[i]?Math.round(enemies[i].x):null; },
  enType(i){ return enemies&&enemies[i]?enemies[i].type:null; },
  get onIce(){ return !!(blob&&blob.onIcePrev); }, get iceCount(){ return iceTiles?iceTiles.length:0; },
  get tramps(){ return tramp?tramp.length:0; }, get trampGlobs(){ return globs?globs.filter(g=>g.tramp).length:0; },
  addGlob(wx,wy){ globs.push({x:wx,y:wy,w:GLOB,h:GLOB,solid:true,solidAt:0,wall:0,tramp:false}); },
  addFormingGlob(wx,wy){ globs.push({x:wx,y:wy,w:GLOB,h:GLOB,solid:false,solidAt:performance.now()+120,born:performance.now(),wall:0,tramp:false}); },
  get solidGlobs(){ return globs?globs.filter(g=>g.solid).length:0; },
  blobPos(){ return blob?{x:Math.round(blob.x),y:Math.round(blob.y)}:null; },
  spikePos(){ const s=spikes&&spikes[0]; return s?{x:s.x,y:s.y}:null; },
  warp(wx,wy){ if(blob){ blob.x=wx; blob.y=wy; blob.vx=0; blob.vy=0; camFollow(true); } },
  get sfxReady(){ return Object.keys(SFXBUF).length; }, kick(){ audio(); },
  get hitStop(){ return Math.round(hitStop*1000); }, get camLook(){ return Math.round(cam.look); },
  get masterGain(){ return master?Math.round(master.gain.value*100):-1; }, get padVoices(){ return mus&&mus.oscs?mus.oscs.length:0; },
  get bgmReady(){ return !!bgmBuf; }, get bgmPlaying(){ return !!(mus&&mus.bgm); }, get trailLen(){ return trail?trail.length:0; },
  lastFall(){ return blob?{d:blob._lastFall,vy:blob._lastVy,apex:Math.round(blob.apexY),y:Math.round(blob.y)}:null; },
  possessAt(cx,cy){ return tryPossess(cx,cy); }, _possess(wx,wy){ return possessWorld(wx,wy); },
  get camSafe(){ return Math.round(camSafeBottom); }, blobScreenBottom(){ return blob?Math.round((blob.y+blob.h-cam.y)*zoom):0; },
  get canvasH(){ return canvas.height; },
  _allSecrets(){ for(let i=0;i<LEVELS.filter(L=>!L.secret).length;i++) save.gems[i]=1; persist(); showMenu(); },
  gotoExit(){ if(blob&&exitRect){ blob.x=exitRect.x; blob.y=exitRect.y; blob.vy=0; } },
  bossHp(){ const e=enemies&&enemies.find(x=>x.type==="boss"); return e?e.hp:-1; },
  bossMode(){ const e=enemies&&enemies.find(x=>x.type==="boss"); return e?(e.mode||'chase'):null; },
  bossPos(){ const e=enemies&&enemies.find(x=>x.type==="boss"); return e?{x:Math.round(e.x),y:Math.round(e.y),y0:Math.round(e.y0)}:null; },
  _forceLeap(){ const e=enemies&&enemies.find(x=>x.type==="boss"); if(e){ e.leapCD=0; e.mode='wind'; e.windT=0.5; } },
  get shotCount(){ return shots?shots.length:0; },
  _stompBoss(){ const e=enemies&&enemies.find(x=>x.type==="boss"); if(e&&blob){ blob.x=e.x+e.w/2-blob.w/2; blob.y=e.y-blob.h+3; blob.vy=260; blob.hurtT=0; e.hitT=0; } },
  get parts(){ return particles?particles.length:0; },
  // TRAÇO DETERMINÍSTICO (pra validar o simulador do solver): roda N frames com dt fixo e
  // inputs por frame, devolve a trajetória do blob. frames=[{mx:-1|0|1, jump, grab, down}]
  simTrace(frames){ if(state!=="play")return null; const FD=1/60, out=[]; const wasBot=botOn; botOn=false;
    for(const f of frames){ IN.kb.left=f.mx<0; IN.kb.right=f.mx>0; IN.kb.down=!!f.down; IN.joyX=0; IN.joyY=0;
      if(f.jump) jumpEdge=true; if(f.grab) grabEdge=true;
      update(FD);
      out.push({x:Math.round(blob.x*1000)/1000, y:Math.round(blob.y*1000)/1000, vx:Math.round(blob.vx*100)/100, vy:Math.round(blob.vy*100)/100, m:blob.mass, g:blob.onGroundPrev?1:0, w:blob.wallPrev||0}); }
    botOn=wasBot; return out; },
  simLevel(){ return level?{rows:level.rows.slice(), mass:level.mass, max:level.max, startPos:{x:startPos.x,y:startPos.y},
    movers:(level.movers||[]).map(m=>Object.assign({},m)), enemies:(level.enemies||[]).map(e=>Object.assign({},e)), devourer:level.devourer||null}:null; },
  _setCoins(){ for(let i=0;i<LEVELS.filter(L=>!L.secret).length;i++) save.coins[i]=1; persist(); },
  _demo(){ save.unlocked=6; [3,3,2,3,1].forEach((s,i)=>save.stars[i]=s); save.coins[0]=1;save.coins[1]=1;save.coins[3]=2; save.gems[0]=1;save.gems[2]=1; persist(); showMenu(); },
  collectAt(gx,gy){ if(blob){ blob.x=gx-8; blob.y=gy-8; } },
  bot(on){ toggleBot(on); return botOn; }, get botOn(){ return botOn; },
  botDbg(){ return {mx:bot.mx,down:bot.down,jump:bot.jump,grab:bot.grab,
    cling:!!(blob&&blob.cling),wall:blob?blob.wallPrev:0,onG:blob?blob.onGroundPrev:0,
    bx:blob?Math.round(blob.x):0,by:blob?Math.round(blob.y):0,ex:exitRect?Math.round(exitRect.x):0,ey:exitRect?Math.round(exitRect.y):0}; },
  edDbg(){ let f=0,c=0; for(let y=0;y<ed.H;y++)for(let x=0;x<ed.W;x++){ if(ed.fake[y]&&ed.fake[y][x])f++; if(ed.grid[y]&&ed.grid[y][x]&&ed.grid[y][x]!==' ')c++; } return {fake:f,cells:c,ents:ed.ents.length,W:ed.W,H:ed.H,slot:ed.editingSlot,pend:ed.pendingSlot}; },
  edBrush(b){ ed.brush=b; }, edPaintCell(x,y){ edApply(x,y); },
  get devourEdge(){ return devourEdge==null?null:Math.round(devourEdge); }, get devourWarn(){ return Math.round(devourWarn*100)/100; } };
