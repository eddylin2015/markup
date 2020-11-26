var add_act=function _add_act(t,v)
{
//	alert('demo add '+t+v);
}
var remove_act=function _remove_act(t,v)
{
//	alert('demo remove '+t+v);
}
var post_act=function _post_act(jsonstr,post_act)
{
	//alert(jsonstr);
}
$(document).ready(function(){
	
function TwoList_Action(srcListName,disListName,ActionType,ActF)
{
	var obj=[];
	var cnt=0;
	$('#'+srcListName+' option:selected').each(function(){
		if($(this).val() != 'null'){
		obj[cnt]=$(this).val();
		cnt++;
		
		ActionType($(this).text(),$(this).val());
		$(this).remove();
		var disList=$('#'+disListName);
		var disOptions;
		if(disList.prop){disOptions = disList.prop('options');}else{disOptions=disList.attr('options');}
		disOptions[disOptions.length]=new Option($(this).text()+ActF,$(this).val());
		}
	});
	post_act(JSON.stringify(obj),ActF);
}
	
$('#btn1').click(function(){
	TwoList_Action('srcList','disList',add_act,'a');	
});

$('#btn2').click(function(){
	TwoList_Action('disList','srcList',remove_act,'r');	
});
});
