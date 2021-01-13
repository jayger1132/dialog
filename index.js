const { chain } = require('bottender');
const dialogflow = require('@bottender/dialogflow');
const request = require("request");
//const cheerio = require("cheerio");
const fs = require("fs");
var jsonfile = require('jsonfile');
const { createBrotliCompress } = require('zlib');
const { parse } = require('path');
const file = "result.json";
// const covid = function(){
//   request({
//     url: "https://od.cdc.gov.tw/eic/Day_Confirmation_Age_County_Gender_19CoV.json",
//     method: "GET"
//   }, function (error , response ,body){
//     if(error|| !body){
//       return;
//     }
//     const $ = cheerio.load(body);
//     const jd = $("pre");
//     var result=[];

//     result.push($(jd).find("pre").eq(0).text());
//     console.log(result);
//     }
//   );

// };

// 寫json檔
/*const covid = function () {
  request('https://od.cdc.gov.tw/eic/Day_Confirmation_Age_County_Gender_19CoV.json', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      
      //將所有body資料丟入result
      //console.log(body)

      //let str = JSON.stringify(body,null,"\t");

      //假設存在有json 就刪除
       if(fs.existsSync('result.json')){
         fs.rmSync('result.json');
       }
      //重新複寫
      fs.writeFileSync('result.json', body);
    }
    //var re = JSON.parse(JSON.stringify("result.json"));
    //console.log(re);
  });
};*/
//分析data
// for(var i = 0 ; i<cols.length;i++){
  //   console.log(data[cols[i]]);
  // }
const analyizegender = function(test){
  var data = JSON.parse(fs.readFileSync(file));
  var cols = Object.keys(data);
  console.log(test);
  //console.log(data[cols[10]]);
  for(var i=0 , countm=0,countw=0; i <cols.length;i++){
    for(const [key,value] of Object.entries(data[cols[i]])){
      if(`${key}` == '性別'){
        if(`${value}`=='男')
          countm++;
        else
          countw++;
      }
    }
  }
  /*console.log(countm);
  console.log(countw);*/
  
  if(test=='男性'||test=='男生'||test=='男人'){return countm;}
  else return countw;
  
};
const analyizegenderrate = function(test){
  var data = JSON.parse(fs.readFileSync(file));
  var cols = Object.keys(data);
  
  //console.log(data[cols[10]]);
  for(var i=0 , countm=0,countw=0; i <cols.length;i++){
    for(const [key,value] of Object.entries(data[cols[i]])){
      if(`${key}` == '性別'){
        if(`${value}`=='男')
          countm++;
        else
          countw++;
      }
    }
  }
  console.log(countm);
  console.log(countw);
  if(test == '男性')
    return parseInt(countm/(countm+countw)*100);
  else
    return parseInt(countw/(countm+countw)*100);
};

const analyizeyesterday = function(){
  var data = JSON.parse(fs.readFileSync(file));
  var cols = Object.keys(data);
  // get time
  var fullDate = new Date(new Date().getTime()-48*60*60*1000);
  var year = fullDate.getFullYear();
  var month = (fullDate.getMonth() + 1) >= 10 ? (fullDate.getMonth() + 1) : ("0" + (fullDate.getMonth() + 1));
  var day = fullDate.getDate() < 10 ? ("0"+fullDate.getDate()) : fullDate.getDate();
  var yesterday = year + '/' +month + '/' +day ;
  //console.log(data[cols[10]]);
  for(var i=0 , count=0; i <cols.length;i++){
    for(const [key,value] of Object.entries(data[cols[i]])){
      if(`${key}` == '個案研判日'){
        if(`${value}`==yesterday)
          count++;
      }
    }
  }
  console.log(count);
  return count;
};
const analyizecity = function(test){
  var data = JSON.parse(fs.readFileSync(file));
  var cols = Object.keys(data);
  //console.log(data[cols[10]]);
  for(var i=0 , count=0; i <cols.length;i++){
    for(const [key,value] of Object.entries(data[cols[i]])){
      if(`${key}` == '縣市'){
        if(`${value}`== test)
          count++;
      }
    }
  }
  console.log(count);
  return count;
};
const analyizehighcity = function(test){
  var data = JSON.parse(fs.readFileSync(file));
  var cols = Object.keys(data);
  //console.log(data[cols[10]]);
  for(var i=0 , count=0; i <cols.length;i++){
    for(const [key,value] of Object.entries(data[cols[i]])){
      if(`${key}` == '縣市'){
        if(`${value}`== test)
          count++;
      }
    }
  }
  console.log(count);
  return count;
};

// dialog 比對
async function genderinfectnumber(context, props) {
  const gender = props.parameters.fields.gender.stringValue;
  await context.sendText(`${gender}確診人數`+ analyizegender(`${gender}`));
}
async function genderinfectrate(context, props) {
  const rate = props.parameters.fields.rate.stringValue;
  await context.sendText('男性: '+analyizegenderrate('男性')+'% '+'女性: '+analyizegenderrate('女性')+'%');
}
async function lastdayaddinfect(context, props) {
  const add = props.parameters.fields.add.stringValue;
  await context.sendText('昨天新增確診'+analyizeyesterday()+'例');
}
async function region(context, props) {
  const city = props.parameters.fields.city.stringValue;

  await context.sendText('個案研判在'+`${city}`+'確診的人數'+analyizecity(`${city}`));
}
async function atpresentinfectthemostcity(context, props) {
  const now = props.parameters.fields.now.stringValue;
  const city = props.parameters.fields.city.stringValue;
  await context.sendText(`${now}`+'個案研判確診人數最高的縣市為'+`${city}`+'確診的人數'+analyizehighcity())
}

const dialogflowAction = dialogflow({
  projectId: process.env.GOOGLE_APPLICATION_PROJECT_ID,
  actions: {
    genderinfectnumber,
    lastdayaddinfect,
    region,
    atpresentinfectthemostcity,
    genderinfectrate
  },
});

module.exports = async function App(context) {
  //covid();
  return chain([
    dialogflowAction,
  ]);
};
