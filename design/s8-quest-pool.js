poolRow=Insert("BzD6e",{type:"frame",name:"Pool Row",reusable:true,layout:"horizontal",alignItems:"center",gap:10,padding:[10,12],fill:"$navy",stroke:"$ink",strokeWidth:3,width:358})
poolType=Insert(poolRow,{type:"frame",name:"Pool Type Tag",layout:"horizontal",alignItems:"center",padding:[4,6],fill:"$ink",stroke:"$sky",strokeWidth:2})
Insert(poolType,{type:"text",name:"Pool Type Label",fontFamily:"$font-head",fontSize:6,fill:"$sky",content:"DAILY"})
poolTitle=Insert(poolRow,{type:"frame",name:"Pool Title Wrap",layout:"vertical",width:"fill_container"})
Insert(poolTitle,{type:"text",name:"Pool Title",fontFamily:"$font-body",fontSize:21,fill:"$white",content:"Run 2 km"})
Insert(poolRow,{type:"text",name:"Pool Remove",fontFamily:"$font-body",fontSize:14,fill:"$slate",content:"remove"})
nav5=Insert("BzD6e",{type:"frame",name:"Nav Bar App",reusable:true,layout:"horizontal",width:358,fill:"$panel-dark",stroke:"$ink",strokeWidth:{top:3}})
for(const t of ["BOARD","POOL","SHOP","LOG","HERO"]){
tab=Insert(nav5,{type:"frame",name:"Tab "+t,layout:"vertical",alignItems:"center",justifyContent:"center",gap:4,padding:[10,0],width:"fill_container"})
Insert(tab,{type:"rectangle",name:"Tab Icon "+t,width:8,height:8,fill:t==="POOL"?"$gold":"$slate"})
Insert(tab,{type:"text",name:"Tab Label "+t,fontFamily:"$font-head",fontSize:7,fill:t==="POOL"?"$gold":"$slate",content:t})
}
pos=FindEmptySpace({width:390,height:844,direction:"right",padding:80,nodeId:"gVCYY"})
s8=Insert(document,{type:"frame",name:"Screen Quest Pool",x:pos.x,y:pos.y,width:390,height:844,layout:"vertical",padding:16,gap:12,fill:"$night",clip:true,placeholder:true})
Insert(s8,{type:"ref",ref:"Ym0xu",name:"Pool HUD",width:"fill_container"})
s8title=Insert(s8,{type:"frame",name:"Pool Title Row",layout:"vertical",alignItems:"center",gap:4,width:"fill_container",padding:[8,0,0,0]})
Insert(s8title,{type:"text",name:"Pool Title",fontFamily:"$font-head",fontSize:13,fill:"$white",content:"QUEST POOL"})
Insert(s8title,{type:"text",name:"Pool Subtitle",fontFamily:"$font-body",fontSize:17,fill:"$fog",content:"Tasks you forge — the game summons a random hand each period."})
function poolSection(label,color,meta,entries){
sec=Insert(s8,{type:"frame",name:"Section "+label,layout:"vertical",gap:8,width:"fill_container"})
hdr=Insert(sec,{type:"frame",name:"Section Header "+label,layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container"})
Insert(hdr,{type:"text",name:"Section Label "+label,fontFamily:"$font-head",fontSize:9,fill:color,content:label})
Insert(hdr,{type:"text",name:"Section Meta "+label,fontFamily:"$font-body",fontSize:15,fill:"$slate",content:meta})
for(const e of entries){
Insert(sec,{type:"ref",ref:poolRow,name:"Pool Item "+e,width:"fill_container",descendants:{"Pool Title":{content:e},"Pool Type Label":{content:label,fill:color},"Pool Type Tag":{stroke:color}}})
}
}
poolSection("DAILY","$sky","summons up to 3",["Drink 2L water","Run 2 km"])
poolSection("SIDE QUEST","$mint","summons up to 2",["Clean the garage"])
poolSection("BOSS","$gold","summons up to 1",["Finish the book"])
addPanel=Insert(s8,{type:"frame",name:"Add Pool Panel",layout:"vertical",gap:8,padding:[10,12],fill:"$panel-dark",stroke:"$ink",strokeWidth:3,width:"fill_container"})
Insert(addPanel,{type:"text",name:"Add Pool Label",fontFamily:"$font-head",fontSize:8,fill:"$slate",content:"ADD TO QUEST POOL"})
addInput=Insert(addPanel,{type:"frame",name:"Add Pool Input",layout:"horizontal",padding:[8,10],fill:"$night",stroke:"$ink",strokeWidth:2,width:"fill_container"})
Insert(addInput,{type:"text",name:"Add Pool Placeholder",fontFamily:"$font-body",fontSize:20,fill:"$slate",content:"e.g. Run 2 km"})
chips=Insert(addPanel,{type:"frame",name:"Type Chips",layout:"horizontal",gap:8,width:"fill_container"})
for(const [lbl,on] of [["DAILY",true],["SIDE QUEST",false],["BOSS",false]]){
c=Insert(chips,{type:"frame",name:"Chip "+lbl,layout:"horizontal",padding:[6,10],fill:on?"$ink":"$navy",stroke:on?"$gold":"$ink",strokeWidth:2})
Insert(c,{type:"text",name:"Chip Label "+lbl,fontFamily:"$font-head",fontSize:7,fill:on?"$gold":"$slate",content:lbl})
}
Insert(addPanel,{type:"text",name:"Add Pool Hint",fontFamily:"$font-body",fontSize:16,fill:"$fog",content:"Randomly summoned — up to 3 per period · XP rolls at spawn"})
Insert(addPanel,{type:"ref",ref:"EOtGZ",name:"Add Pool Button",width:"fill_container",descendants:{"o7eos":{content:"ADD TO POOL",fill:"#0c2a18"}}})
Insert(s8,{type:"frame",name:"Pool Spacer",width:"fill_container",height:"fill_container"})
Insert(s8,{type:"ref",ref:nav5,name:"Pool Nav",width:"fill_container"})
Update(s8,{placeholder:false})
