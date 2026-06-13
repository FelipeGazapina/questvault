pos=FindEmptySpace({width:390,height:844,direction:"right",padding:80,nodeId:"W2ifb"})
s3=Insert(document,{type:"frame",name:"Screen Loot Shop",x:pos.x,y:pos.y,width:390,height:844,layout:"vertical",padding:16,gap:12,fill:"$night",clip:true,placeholder:true})
Insert(s3,{type:"ref",ref:"Ym0xu",name:"Shop HUD",width:"fill_container"})
s3title=Insert(s3,{type:"frame",name:"Shop Title Row",layout:"horizontal",justifyContent:"center",width:"fill_container",padding:[8,0,0,0]})
Insert(s3title,{type:"text",name:"Shop Title",fontFamily:"$font-head",fontSize:13,fill:"$white",content:"LOOT SHOP"})
function lootItem(title,price,hint,filled,ready){
it=Insert(s3,{type:"frame",name:"Item "+title,layout:"vertical",gap:7,padding:[10,12],fill:"$navy",stroke:ready?"$gold":"$ink",strokeWidth:3,width:"fill_container"})
r1=Insert(it,{type:"frame",name:"Item Row "+title,layout:"horizontal",justifyContent:"space_between",alignItems:"center",width:"fill_container"})
Insert(r1,{type:"text",name:"Item Title "+title,fontFamily:"$font-body",fontSize:21,fill:"$white",content:title})
Insert(r1,{type:"text",name:"Item Price "+title,fontFamily:"$font-money",fontSize:13,fontWeight:"600",fill:"$gold",content:price})
Insert(it,{type:"text",name:"Item Hint "+title,fontFamily:"$font-body",fontSize:16,fill:"$fog",content:hint})
bar=Insert(it,{type:"frame",name:"Item Bar "+title,layout:"horizontal",gap:2,padding:2,fill:"$deep",stroke:"$ink",strokeWidth:2})
for(let i=0;i<32;i++){Insert(bar,{type:"rectangle",name:"Bar Cell "+(i+1),width:8,height:8,fill:i<filled?"$gold":"$night"})}
return it
}
ready=lootItem("Pizza night (iFood)","R$ 21,90","Pouch covers it — you earned this one.",32,true)
Insert(ready,{type:"ref",ref:"EOtGZ",name:"Claim Button",width:"fill_container",fill:"$gold",descendants:{"o7eos":{content:"CLAIM LOOT",fill:"#4a3208"}}})
lootItem("Headset gamer","R$ 180,00","R$ 23 / R$ 180 — about 78 km of running to go",4,false)
lootItem("PS5 (one day…)","R$ 3.499,00","R$ 23 / R$ 3.499 — a true boss fight",1,false)
ghost=Insert(s3,{type:"frame",name:"Add Wishlist Button",layout:"horizontal",justifyContent:"center",alignItems:"center",padding:[12,16],stroke:"$ink",strokeWidth:3,width:"fill_container"})
Insert(ghost,{type:"text",name:"Add Wishlist Label",fontFamily:"$font-head",fontSize:9,fill:"$slate",content:"+ ADD TO WISHLIST (TITLE + LINK)"})
Insert(s3,{type:"frame",name:"Shop Spacer",width:"fill_container",height:"fill_container"})
Insert(s3,{type:"ref",ref:"f31Xd",name:"Shop Nav",width:"fill_container",descendants:{"ca2B5":{fill:"$slate"},"NLY0t":{fill:"$slate"},"NpvgV":{fill:"$gold"},"KKDEL":{fill:"$gold"}}})
Update(s3,{placeholder:false})
