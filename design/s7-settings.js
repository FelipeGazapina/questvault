pos=FindEmptySpace({width:390,height:844,direction:"right",padding:80,nodeId:"ZRfY1"})
s7=Insert(document,{type:"frame",name:"Screen Wallet Settings",x:pos.x,y:pos.y,width:390,height:844,layout:"vertical",padding:16,gap:12,fill:"$night",clip:true,placeholder:true})
Insert(s7,{type:"ref",ref:"Ym0xu",name:"Settings HUD",width:"fill_container"})
s7title=Insert(s7,{type:"frame",name:"Settings Title Row",layout:"horizontal",justifyContent:"center",width:"fill_container",padding:[8,0,0,0]})
Insert(s7title,{type:"text",name:"Settings Title",fontFamily:"$font-head",fontSize:12,fill:"$white",content:"SETTINGS â€” WALLET"})
function panel(name,header){
p=Insert(s7,{type:"frame",name:name,layout:"vertical",gap:9,padding:[10,12],fill:"$panel-dark",stroke:"$ink",strokeWidth:3,width:"fill_container"})
Insert(p,{type:"text",name:name+" Header",fontFamily:"$font-head",fontSize:8,fill:"$slate",content:header})
return p
}
function row(parent,name,left,leftFill,tag,tagFill){
r=Insert(parent,{type:"frame",name:name,layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container"})
Insert(r,{type:"text",name:name+" Label",fontFamily:"$font-body",fontSize:19,fill:leftFill,content:left})
tg=Insert(r,{type:"frame",name:name+" Tag",layout:"horizontal",padding:[4,6],fill:"$ink"})
Insert(tg,{type:"text",name:name+" Tag Label",fontFamily:"$font-head",fontSize:7,fill:tagFill,content:tag})
}
tier=panel("Tier Panel","REWARD TIER")
row(tier,"Tier Row","Real loot","$white","ACTIVE","$mint")
ver=panel("Verification Panel","VERIFICATION")
row(ver,"Strava Row","Strava","$white","CONNECTED","$mint")
row(ver,"Health Row","Apple Health","$fog","CONNECT","$slate")
sub=panel("License Panel","HERO'S LICENSE")
row(sub,"License Row","Hero Â· monthly","$white","ACTIVE","$mint")
Insert(sub,{type:"text",name:"License Detail",fontFamily:"$font-money",fontSize:13,fill:"$fog",content:"R$ 19,90/month Â· renews Jul 11, 2026"})
wd=panel("Withdraw Panel","YOUR GOLD")
Insert(wd,{type:"text",name:"Withdraw Title",fontFamily:"$font-body",fontSize:20,fill:"$white",content:"Leave the dungeon"})
Insert(wd,{type:"text",name:"Withdraw Desc",fontFamily:"$font-body",fontSize:16,fill:"$fog",textGrowth:"fixed-width",width:"fill_container",content:"Withdraw everything to your own bank account. Always 100%, always free. Sealed gold has a 7-day cooldown; pouch gold leaves instantly."})
wdBtn=Insert(wd,{type:"frame",name:"Withdraw Button",layout:"horizontal",justifyContent:"center",alignItems:"center",padding:[10,16],stroke:"$ember",strokeWidth:3,width:"fill_container"})
Insert(wdBtn,{type:"text",name:"Withdraw Button Label",fontFamily:"$font-head",fontSize:9,fill:"$ember",content:"START WITHDRAWAL"})
Insert(s7,{type:"frame",name:"Settings Spacer",width:"fill_container",height:"fill_container"})
Insert(s7,{type:"ref",ref:"f31Xd",name:"Settings Nav",width:"fill_container",descendants:{"ca2B5":{fill:"$slate"},"NLY0t":{fill:"$slate"}}})
Update(s7,{placeholder:false})

