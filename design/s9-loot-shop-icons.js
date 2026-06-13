pos=FindEmptySpace({width:390,height:844,direction:"right",padding:80,nodeId:"BdYJN"})
s9=Insert(document,{type:"frame",name:"Screen Loot Shop Icons",x:pos.x,y:pos.y,width:390,height:844,layout:"vertical",padding:16,gap:12,fill:"$night",clip:true,placeholder:true})
Insert(s9,{type:"ref",ref:"Ym0xu",name:"Shop Icons HUD",width:"fill_container"})
s9title=Insert(s9,{type:"frame",name:"Shop Icons Title",layout:"horizontal",justifyContent:"center",width:"fill_container",padding:[8,0,0,0]})
Insert(s9title,{type:"text",name:"Shop Icons Title Text",fontFamily:"$font-head",fontSize:13,fill:"$white",content:"LOOT SHOP"})
function lootCard(title,price,iconRef){
card=Insert(s9,{type:"frame",name:"Card "+title,layout:"vertical",gap:7,padding:[10,12],fill:"$navy",stroke:"$ink",strokeWidth:3,width:"fill_container"})
row=Insert(card,{type:"frame",name:"Card Row "+title,layout:"horizontal",alignItems:"center",gap:10,width:"fill_container"})
iconBox=Insert(row,{type:"frame",name:"Icon Box "+title,layout:"horizontal",alignItems:"center",justifyContent:"center",width:44,height:44,fill:"$deep",stroke:"$ink",strokeWidth:2})
Insert(iconBox,{type:"ref",ref:iconRef,name:"Icon "+title,width:36,height:36})
Insert(row,{type:"text",name:"Card Title "+title,fontFamily:"$font-body",fontSize:21,fill:"$white",content:title,width:"fill_container"})
Insert(row,{type:"text",name:"Card Price "+title,fontFamily:"$font-money",fontSize:13,fontWeight:"600",fill:"$gold",content:price})
return card
}
lootCard("Headset gamer","R$ 180,00","EVaUy")
lootCard("Pizza night (iFood)","R$ 21,90","jJf8V")
add=Insert(s9,{type:"frame",name:"Add Panel",layout:"vertical",gap:8,padding:[10,12],fill:"$panel-dark",stroke:"$ink",strokeWidth:3,width:"fill_container"})
Insert(add,{type:"text",name:"Add Header",fontFamily:"$font-head",fontSize:8,fill:"$slate",content:"ADD TO WISHLIST (TITLE + LINK)"})
Insert(add,{type:"text",name:"Pick Icon Label",fontFamily:"$font-head",fontSize:7,fill:"$fog",content:"PICK YOUR LOOT ICON"})
picker=Insert(add,{type:"frame",name:"Icon Picker",layout:"horizontal",gap:8,width:"fill_container"})
row2=Insert(add,{type:"frame",name:"Icon Picker Row 2",layout:"horizontal",gap:8,width:"fill_container"})
for(const [id,ref] of [["EVaUy","EVaUy"],["jJf8V","jJf8V"],["OeDF2","OeDF2"],["S32SB","S32SB"]]){
chip=Insert(picker,{type:"frame",name:"Icon Chip "+id,layout:"horizontal",alignItems:"center",justifyContent:"center",width:48,height:48,fill:"$night",stroke:"$ink",strokeWidth:2})
Insert(chip,{type:"ref",ref:ref,name:"Chip Icon "+id,width:36,height:36})
}
for(const [id,ref] of [["CFWqc","CFWqc"],["hNaVF","hNaVF"],["s5I31K","s5I31K"],["OsDLS","OsDLS"]]){
chip=Insert(row2,{type:"frame",name:"Icon Chip "+id,layout:"horizontal",alignItems:"center",justifyContent:"center",width:48,height:48,fill:"$night",stroke:"$ink",strokeWidth:2})
Insert(chip,{type:"ref",ref:ref,name:"Chip Icon "+id,width:36,height:36})
}
Insert(s9,{type:"frame",name:"Shop Icons Spacer",width:"fill_container",height:"fill_container"})
Insert(s9,{type:"ref",ref:"L7UYQ",name:"Shop Icons Nav",width:"fill_container",descendants:{"Tab SHOP":{fill:"$gold"}}})
Update(s9,{placeholder:false})
