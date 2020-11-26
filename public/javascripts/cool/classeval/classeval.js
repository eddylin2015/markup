
function AnsNewRow(id,user,date,note,desc,toTeacher,toClass,dept,sect,subj,addr,cstatus,key){
var r={
'id':id,
'user': user,
'date': date,
'note': note,
'desc': desc,
'teacher':toTeacher,
'class':toClass,
'dept':dept,
'sect':sect,
'subj':subj,
'addr':addr,
'cstatus':cstatus,
'A':0,'B':0,'C':0,'D':'','E':'','F':'','G':'','H':'','I':'','J':0,'K':0,'L':0,'M':0,'N':0,'O':'',
'status':2, 
'key':key ,
'QMKEY':'CE001' }; return r;}
function HideForms()
{
	document.getElementById('form_no1').style.display ='none';
//	document.getElementById('form_no2').style.display ='none';
//	document.getElementById('form_no3').style.display ='none';
}
function Button1Event()
{
//	document.getElementById('form_no2').style.display ='block';
//	document.getElementById('form_no3').style.display ='none';
}
function Button2Event()
{
//	document.getElementById('form_no2').style.display ='none';
//	document.getElementById('form_no3').style.display ='block';
}
function InitalizePage(){
HideForms();
}
var AnsData=new Array();

//config localStorage.AnsDataCE001
function SavelocalStorage()
{	
	localStorage.AnsDataCE001=JSON.stringify(AnsData);		
}
function GetlocalStorage()
{
	return localStorage.AnsDataCE001;
}
//fieldname mapping example: note->A, date->B
//var title_fn=['note','date'];
var title_fn=[];
//var detail_fn=['A','D'];
var detail_fn=[];

