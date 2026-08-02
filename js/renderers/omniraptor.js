(() => {
  const PATTERN_C_BASE="./assets/embedded/omniraptor/image-001-d811315d.png";
  const PATTERN_C_MASKS={
      dominant: "./assets/embedded/omniraptor/image-002-30952556.png",
      markings: "./assets/embedded/omniraptor/image-003-0f55d2d9.png",
      flank: "./assets/embedded/omniraptor/image-004-fcefe431.png",
      detail: "./assets/embedded/omniraptor/image-005-4fa1756f.png",
      body: "./assets/embedded/omniraptor/image-006-8e4d7c03.png",
      underside: "./assets/embedded/omniraptor/image-007-be8f6cdd.png",
      eyes: "./assets/embedded/omniraptor/image-008-ad874062.png"
  };
  const PATTERN_A_BASE="./assets/embedded/omniraptor/image-009-5acf502a.png";
  const PATTERN_A_MASKS={
      dominant: "./assets/embedded/omniraptor/image-010-720f9512.png",
      markings: "./assets/embedded/omniraptor/image-011-3178247f.png",
      flank: "./assets/embedded/omniraptor/image-012-8242645d.png",
      detail: "./assets/embedded/omniraptor/image-005-4fa1756f.png",
      body: "./assets/embedded/omniraptor/image-014-08675ae3.png",
      underside: "./assets/embedded/omniraptor/image-015-0393a687.png",
      eyes: "./assets/embedded/omniraptor/image-008-ad874062.png"
  };
  const BASE="./assets/embedded/omniraptor/image-017-d0c2f89c.png";
  const MASKS={
    dominant: "./assets/embedded/omniraptor/image-018-35eeffd7.png",
    markings: "./assets/embedded/omniraptor/image-019-78a8ae28.png",
    flank: "./assets/embedded/omniraptor/image-020-155268d5.png",
    detail: "./assets/embedded/omniraptor/image-005-4fa1756f.png",
    body: "./assets/embedded/omniraptor/image-022-b8680827.png",
    underside: "./assets/embedded/omniraptor/image-023-4a55adfa.png",
    eyes: "./assets/embedded/omniraptor/image-024-ca5ab23f.png"
  };
  const PATTERN_D_BASE="./assets/embedded/omniraptor/pattern-d/base.png";
  const PATTERN_D_MASKS={
    dominant: "./assets/embedded/omniraptor/pattern-d/dominant.png",
    markings: "./assets/embedded/omniraptor/pattern-d/markings.png",
    flank: "./assets/embedded/omniraptor/pattern-d/flank.png",
    detail: "./assets/embedded/omniraptor/pattern-d/detail.png",
    body: "./assets/embedded/omniraptor/pattern-d/body.png",
    underside: "./assets/embedded/omniraptor/pattern-d/underside.png",
    eyes: "./assets/embedded/omniraptor/pattern-d/eyes.png"
  };
  const PATTERN_E_BASE="./assets/embedded/omniraptor/pattern-e/base.png";
  const PATTERN_E_MASKS={
    dominant: "./assets/embedded/omniraptor/pattern-e/dominant.png",
    markings: "./assets/embedded/omniraptor/pattern-e/markings.png",
    flank: "./assets/embedded/omniraptor/pattern-e/flank.png",
    detail: "./assets/embedded/omniraptor/pattern-e/detail.png",
    body: "./assets/embedded/omniraptor/pattern-e/body.png",
    underside: "./assets/embedded/omniraptor/pattern-e/underside.png",
    eyes: "./assets/embedded/omniraptor/pattern-e/eyes.png"
  };
  const CHANNELS=["dominant","markings","flank","detail","body","underside","eyes"];
  const stegoCanvas=document.getElementById("dinoPreview");
  const canvas=document.getElementById("omniPreview");
  const ctx=canvas?.getContext("2d",{willReadFrequently:true});
  const dino=document.getElementById("dinoSelect");
  const patternSelect=document.getElementById("patternSelect");
  const patternNote=document.getElementById("previewPatternNote");
  const species=document.getElementById("speciesSelect");
  const badge=document.getElementById("previewSpeciesBadge");
  if(!canvas||!ctx||!stegoCanvas||!dino)return;

  const state={
    patterns:{
      A:{base:null,masks:{},ready:false},
      B:{base:null,masks:{},ready:false},
      C:{base:null,masks:{},ready:false},
      D:{base:null,masks:{},ready:false},
      E:{base:null,masks:{},ready:false}
    },
    hold:false,
    timer:null
  };

  function load(src){
    return new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;
    });
  }
  function validHex(value){
    value=String(value||"").trim().toUpperCase();
    return /^#[0-9A-F]{6}$/.test(value)?value:"#FFFFFF";
  }
  function rgb(hex){
    const n=parseInt(validHex(hex).slice(1),16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  }
  function colors(){
    const pickers=[...document.querySelectorAll('#pickers input[type="color"]')];
    return CHANNELS.map((_,i)=>validHex(pickers[i]?.value));
  }
  function renderOmni(){
    if(dino.value!=="omniraptor")return;

    const pattern=patternSelect?.value||"B";
    const active=state.patterns[pattern];
    if(!active?.ready)return;

    canvas.width=active.base.naturalWidth;
    canvas.height=active.base.naturalHeight;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(active.base,0,0);

    if(state.hold)return;

    const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
    const data=frame.data;
    const targets=colors().map(rgb);

    CHANNELS.forEach((name,index)=>{
      const female =
        document.getElementById("sexSelect")?.value === "female";
      const colorIndex =
        female && name === "dominant" ? 1 : index;

      const mask=active.masks[name];
      if(!mask)return;

      const [tr,tg,tb]=targets[colorIndex];

      for(let i=0;i<data.length;i+=4){
        const amount=(mask[i]/255)*(mask[i+3]/255);
        if(amount<.02)continue;

        const lum=(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/255;
        const shade=.30+Math.pow(lum,.76)*1.02;
        const nr=Math.min(255,tr*shade);
        const ng=Math.min(255,tg*shade);
        const nb=Math.min(255,tb*shade);
        const strength=Math.min(1,amount*1.12);

        data[i]=data[i]*(1-strength)+nr*strength;
        data[i+1]=data[i+1]*(1-strength)+ng*strength;
        data[i+2]=data[i+2]*(1-strength)+nb*strength;
      }
    });

    ctx.putImageData(frame,0,0);
  }
  function wakeStego(){
    document.querySelector('#pickers input[type="color"]')
      ?.dispatchEvent(new Event("input",{bubbles:true}));
  }
  function schedule(now=false){
    clearTimeout(state.timer);
    state.timer=setTimeout(()=>{
      if(dino.value==="omniraptor") renderOmni();
    },now?0:135);
  }
  function updatePreviewLabels(){
    const pattern=patternSelect?.value||"B";
    const omni=dino.value==="omniraptor";

    if(badge){
      badge.textContent=omni
        ? `Omniraptor · Pattern ${pattern}`
        : `Stegosaurus · Pattern ${pattern}`;
    }

    if(patternNote){
      patternNote.textContent=`Pattern ${pattern}`;
    }
  }

  function choose(value){
    dino.value=value;
    const omni=value==="omniraptor";

    // The Omniraptor renderer owns only the Omniraptor canvas.
    // The dedicated Stego renderer owns all Stego A/B/C canvases and masks.
    stegoCanvas.style.display="none";
    canvas.style.display=omni?"block":"none";

    if(patternSelect){
      patternSelect.disabled=false;
      [...patternSelect.options].forEach(option=>{
        option.disabled=false;
      });
    }

    updatePreviewLabels();

    if(omni) schedule(true);
  }

  dino.addEventListener("change",()=>{
    const previewSpeciesId = {
      beipi: "1",
      allo: "0",
      carno: "2",
      cerato: "3",
      dilo: "6",
      dryo: "7",
      hypsi: "10",
      maia: "11",
      kentro: "20",
      omniraptor: "12",
      stego: "15",
      tenonto: "16",
      troodon: "18",
      trex: "19"
    }[dino.value];

    // Keep the generated-code species synchronized with the dinosaur preview.
    if(species && species.value!==previewSpeciesId){
      species.value=previewSpeciesId;
      species.dispatchEvent(new Event("change",{bubbles:true}));
    }else{
      choose(dino.value);
    }
  });
  patternSelect?.addEventListener("change",()=>{
    updatePreviewLabels();
    if(dino.value==="omniraptor") schedule(true);
  });
  species?.addEventListener("change",()=>{
    if(species.value==="12")choose("omniraptor");
    else if(species.value==="15")choose("stego");
    // Troodon is handled by its own dedicated renderer below.
  });
  document.getElementById("pickers")?.addEventListener("input",e=>{
    if(
      dino.value==="omniraptor" &&
      e.target.matches('input[type="color"],.hex-input')
    ) schedule(false);
  });
  document.getElementById("pickers")?.addEventListener("change",e=>{
    if(
      dino.value==="omniraptor" &&
      e.target.matches('input[type="color"],.hex-input')
    ) schedule(true);
  });
  ["randomBtn","resetBtn","decodeBtn"].forEach(id=>
    document.getElementById(id)?.addEventListener("click",()=>{
      if(dino.value==="omniraptor") schedule(false);
    })
  );

  const original=document.getElementById("originalPreviewBtn");
  const hold=e=>{if(dino.value!=="omniraptor")return;e?.preventDefault();state.hold=true;renderOmni();};
  const release=e=>{if(dino.value!=="omniraptor")return;e?.preventDefault();state.hold=false;renderOmni();};
  original?.addEventListener("mousedown",hold);
  original?.addEventListener("mouseup",release);
  original?.addEventListener("mouseleave",release);
  original?.addEventListener("touchstart",hold,{passive:false});
  original?.addEventListener("touchend",release,{passive:false});

  document.getElementById("savePreviewBtn")?.addEventListener("click",e=>{
    if(dino.value!=="omniraptor")return;
    e.stopImmediatePropagation();e.preventDefault();renderOmni();
    const a=document.createElement("a");
    a.href=canvas.toDataURL("image/png");
    a.download=`Omniraptor_Pattern_${patternSelect?.value||"B"}_preview.png`;
    a.click();
  },true);

  function preparePattern(pattern,baseImage,maskImages,subtractBase=false){
    const temp=document.createElement("canvas");
    temp.width=baseImage.naturalWidth;
    temp.height=baseImage.naturalHeight;
    const tempCtx=temp.getContext("2d",{willReadFrequently:true});

    const target=state.patterns[pattern];
    target.base=baseImage;

    let basePixels=null;
    if(subtractBase){
      tempCtx.clearRect(0,0,temp.width,temp.height);
      tempCtx.drawImage(baseImage,0,0);
      basePixels=tempCtx.getImageData(0,0,temp.width,temp.height).data;
    }

    CHANNELS.forEach((channel,index)=>{
      tempCtx.clearRect(0,0,temp.width,temp.height);
      tempCtx.drawImage(maskImages[index],0,0);
      const source=tempCtx.getImageData(0,0,temp.width,temp.height).data;

      if(!subtractBase){
        target.masks[channel]=source;
        return;
      }

      const clean=new Uint8ClampedArray(source.length);
      for(let pixel=0;pixel<source.length;pixel+=4){
        const baseLuma=.2126*basePixels[pixel]+.7152*basePixels[pixel+1]+.0722*basePixels[pixel+2];
        const sourceLuma=.2126*source[pixel]+.7152*source[pixel+1]+.0722*source[pixel+2];
        let amount=(sourceLuma-baseLuma)/Math.max(24,255-baseLuma);
        amount=Math.max(0,Math.min(1,(amount-.018)/.982));
        const value=Math.round(amount*255);
        clean[pixel]=value;
        clean[pixel+1]=value;
        clean[pixel+2]=value;
        clean[pixel+3]=255;
      }
      target.masks[channel]=clean;
    });

    target.ready=true;
  }

  Promise.all([
    load(PATTERN_A_BASE),
    ...CHANNELS.map(channel=>load(PATTERN_A_MASKS[channel])),
    load(BASE),
    ...CHANNELS.map(channel=>load(MASKS[channel])),
    load(PATTERN_C_BASE),
    ...CHANNELS.map(channel=>load(PATTERN_C_MASKS[channel])),
    load(PATTERN_D_BASE),
    ...CHANNELS.map(channel=>load(PATTERN_D_MASKS[channel])),
    load(PATTERN_E_BASE),
    ...CHANNELS.map(channel=>load(PATTERN_E_MASKS[channel]))
  ]).then(images=>{
    const block=1+CHANNELS.length;

    const patternABase=images[0];
    const patternAMasks=images.slice(1,block);

    const patternBBase=images[block];
    const patternBMasks=images.slice(block+1,block*2);

    const patternCBase=images[block*2];
    const patternCMasks=images.slice(block*2+1,block*3);

    const patternDBase=images[block*3];
    const patternDMasks=images.slice(block*3+1,block*4);

    const patternEBase=images[block*4];
    const patternEMasks=images.slice(block*4+1,block*5);

    preparePattern("A",patternABase,patternAMasks);
    preparePattern("B",patternBBase,patternBMasks);
    preparePattern("C",patternCBase,patternCMasks);
    preparePattern("D",patternDBase,patternDMasks,true);
    preparePattern("E",patternEBase,patternEMasks,true);

    if(species?.value==="12")choose("omniraptor");
    else choose(dino.value);
  }).catch(err=>console.error("Omniraptor preview failed:",err));
})();









