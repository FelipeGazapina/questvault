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
