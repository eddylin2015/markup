//////////Program Start
$(function(){
	//公用變數

		var $login_dlg		=$('#login_dlg'); 
		var $inputLoginUser	=$('#inputLoginUser');           
		var $inputLoginPassword	=$('#inputLoginPassword');
		var $inputLoginKey	=$('#inputLoginKey');
		var $form_txtinfo	=$("#form_txtinfo");
		var $form_detail	=$("#form_detail");
		var $form_add_class	=$('#form_add_class');
		var LessonData=new Array();
		var lesson_cnt=0;
	
	//公用功能
	
		$('#inputseatno_dlg').dialog(
		{	autoOpen:false,
		open: function()
				{
					$inputLoginPassword.val("");
					$inputLoginKey.val("");
				}
		});
		$login_dlg.dialog({
			autoOpen:false,
			minWidth:400,
			title:'登入:',
			open: function()
				{
					$inputLoginPassword.val("");
					$inputLoginKey.val("");
				},
			buttons:{
				'巡堂':function()
				{
					if(navigator.onLine){
						//eval.php檢查用戶
					$.post("eval.php",
					{ 'u': $inputLoginUser.val(), 				
					  'p': $inputLoginPassword.val(),
					  'k': $inputLoginPassword.val(),
					  't':'CE',
					  'Operation':"GetEval"
					},
					function(data) {
						if(data.errorcode==1){
							alert("登入成功!");
							$login_dlg.dialog('close');
							$('#username').text($inputLoginUser.val());
						        localStorage.username=$inputLoginUser.val();
							localStorage.staf_ref=data.staf_ref;
							FormSelectOption();
						}else if(data.errorcode==-1){
							alert("登入失敗!");
						}else{
							alert(data.msg);
						}
					}, "json");	
					}	
				}
			}
		});
		
		function FormRevomeOption()
		{
			var select = $('#formid_select');
			var options;
			if(select.prop) { options = select.prop('options');}else { options = select.attr('options');}
			$('option', select).remove();
		}
		function FormSelectOption()
		{
			var select = $('#formid_select');
			var options;
			if(select.prop) { options = select.prop('options');}else { options = select.attr('options');}
			$('option', select).remove();
			options[options.length] = new Option( "功能選項",-2);			
			options[options.length] = new Option( "登記新課",-1);
		}
		$("#btn_AddClass").click(function(){
			$form_add_class.dialog('open');
		});
		$("#formid_select").change(function () {
			var id=0;
			$("#formid_select option:selected").each(function () {
			    id=$(this).val();
			});
			if(id > -1 && localStorage.username)
			{
			  var row=LessonData[id];
			  $('#cp_subject').text(row.subject);
			  $('#cp_teacher').text(row.teacher);
			for(var i=0;i<4;i++)	
		  	  for(var j=1;j<5;j++) 
				$("#r"+i+"_"+j).removeAttr('checked');                         		       
                          if(row.lesson_pref>0 && row.lesson_pref<5) $('#r0'+"_"+row.lesson_pref).attr("checked",true);
			  if(row.student_dress>0 && row.student_dress<5) $('#r1'+"_"+row.student_dress).attr("checked",true);
  			  if(row.student_manner>0 && row.student_manner<5) $('#r2'+"_"+row.student_manner).attr("checked",true);
  			  if(row.classroom_clean>0 && row.classroom_clean<5) $('#r3'+"_"+row.classroom_clean).attr("checked",true);
			  $('#classperform').show();
			}else{
			  $('#classperform').hide();
			}
			$('#formresetbtn').click();
		});
		/*
		$("input[type='radio']").change( function() {
			var id=$("#formid_select").val();
			var n=$(this).attr('id').split("_");

			var fieldname=n[0];
			if(fieldname=='r0') fieldname='lesson_pref';
			if(fieldname=='r1') fieldname='student_dress';
			if(fieldname=='r2') fieldname='student_manner';
			if(fieldname=='r3') fieldname='classroom_clean';             
			var fieldval=n[1];
			var row=LessonData[id];
			row[fieldname]=fieldval;
			if(row.status==0) row.status=1;
			//LessonData[i]["isUpdated"]=1;
			localStorage.LessonData=JSON.stringify(LessonData);
		});*/
		$("input[type='radio']").change( function() {
			var id=$("#formid_select").val();
			var n=$(this).attr('id').split("_");
			var fieldname=n[0];
			var fieldval=n[1];
			var row=AnsData[id];
			row[fieldname]=Number(fieldval)+1;
			if(row.status==0) row.status=1;
			SavelocalStorage();
			//localStorage.AnsData=JSON.stringify(AnsData);
		});		
		$("input[type='text']").change( function() {
			var id=$("#formid_select").val();
			var n=$(this).attr('id').split("_");
			var fieldname=n[0];
			//var fieldval=n[1];
			var row=AnsData[id];
			row[fieldname]=$('#'+fieldname).val();
			if(row.status==0) row.status=1;
			SavelocalStorage();
			//localStorage.AnsData=JSON.stringify(AnsData);
		});
		function hideForms()
		{
		$form_txtinfo.hide();
		//$form_detail.hide();
		$('#classperform').hide();
		}

		//事件event
		$form_add_class.dialog({
			autoOpen:false,
			minWidth:400,
			title:'增加一堂課記錄:',
			open: function(){
			var id=-1;
			$("#formid_select option:selected").each(function (){id=$(this).val();});
			if (id>-1){
				$('#form_add_class_id').val(id);
				var row=LessonData[id];
				$('#form_add_class_teacher').val(row.teacher);
				$('#form_add_class_date').val(row.date);
				$('#form_add_class_classno').val(row.classno);
 			        $('#form_add_class_sno').val(row.sectno);
			        $('#form_add_class_nos').val(row.nofs);
			        $('#form_add_class_subject').val(row.subject);
			}else{
				$('#form_add_class_id').val(lesson_cnt);
				var now = new Date();
				var datestr= now.getFullYear() + "/" + now.getMonth() + "/" + now.getDate() ;
				$('#form_add_class_date').val(datestr);
				$('#form_add_class_teacher').val(localStorage.username);
				$('#form_add_eval_teacher').val(localStorage.username);
				$('#form_add_class_classno').val("");
 			        $('#form_add_class_sno').val("");
			        $('#form_add_class_nos').val("");
			        $('#form_add_class_subject').val("");
			}
			},
			buttons:{'ADD/Edit':function()
			{
			    var class_id=$('#form_add_class_id').val();
			    var teacher=$('#form_add_class_teacher').val();
			    var classdate=$('#form_add_class_date').val();
			    var classno="";
			    $("#form_add_class_classno option:selected").each(function () {classno=$(this).val();});
 			    var sno=$('#form_add_class_sno').val();
			    var nos=$('#form_add_class_nos').val();
			    var subject=$('#form_add_class_subject').val();
			    var desc=$('#form_add_class_date').val()+"."+$('#form_add_class_sno').val()+"."+classno+"."
					+$('#form_add_class_subject').val();
			    var now = new Date();
			    var key=localStorage.staf_ref+now.getTime();
 			    if(class_id==lesson_cnt)
   			    {
				var new_row=AnsNewRow(lesson_cnt,teacher,classdate,classno,sno,nos,subject,desc,key);
				
				var new_row={
					"id":lesson_cnt,
					"teacher": teacher,
					"date": classdate,
					"classno": classno,
					"sectno": sno,
					"nofs": nos,
					"subject": subject,
					"desc": desc,
					"lesson_pref": 0,
					"student_dress": 0,
					"student_manner": 0,
					"classroom_clean": 0,
					"status":2,  //0,1,2:  C:Complete;M:modify; A:Add New;
					"key":key      //staf-ref-date-time;
					};

				LessonData[lesson_cnt]=new_row;

				$form_add_class.dialog('close');
				
				var select = $('#formid_select');
				var options;
				if(select.prop) { options = select.prop('options');}else { options = select.attr('options');}
				options[options.length] = new Option(desc,lesson_cnt);
				lesson_cnt++;
				
			    }else{
				LessonData[class_id].teacher=teacher;
				LessonData[class_id].date=classdate;
				LessonData[class_id].classno=classno;
				LessonData[class_id].sectno=sno;
				LessonData[class_id].nofs=nos;
				LessonData[class_id].subject=subject;
				LessonData[class_id].desc=desc;
				if(LessonData[class_id].status==0) LessonData[class_id].status=1;
				$form_add_class.dialog('close');
			    }
  			    localStorage.LessonData=JSON.stringify(LessonData);
			}
			}
		});

		$("#UpdateData_btn").click(function(){ 
		});
		$("#UpdateData_Logout_btn").click(function(){ 
			localStorage.username='';
			localStorage.staf_ref='';
			FormRevomeOption();
			$('#username').text('');
			$login_dlg.dialog('open');
		});

	//主程式入口
	//Public Main
	//Begin
		hideForms();
		if(localStorage.username){
			//evaldata= eval('(' + localStorage.evaldata + ')');
			$('#username').text(localStorage.username);
			FormSelectOption();
			if(localStorage.LessonData){
			LessonData= eval('(' + localStorage.LessonData + ')');
			for(var i=0;i<LessonData.length;i++)
			{
				
				var r=LessonData[i];
				var desc=r.desc;
				var select = $('#formid_select');
				var options;
				if(select.prop) { options = select.prop('options');}else { options = select.attr('options');}
				options[options.length] = new Option(desc,lesson_cnt);
				lesson_cnt++;
			}
			}
		}else{
			$login_dlg.dialog('open');
		}
	///End
	 });

