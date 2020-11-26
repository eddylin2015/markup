var profileUserName 
var profileUserNameId
var exports_m0 = [
    //{ n: 'Library gov mo', lnk: 'https://www.library.gov.mo/zh-hant/library-collections/e-resources' },
    { n: 'eClass 內聯平台', lnk: 'https://eclass.macaubaptist.edu.mo/templates/' },
    { n: '校內直播平台', lnk: 'http://tv.mbc.edu.mo' },
    { n: '職業興趣問卷', lnk:'http://info.mbc.edu.mo:8080/jobcareer/index.html'},    
    { n: 'AMDPV5富士施樂', lnk:'http://amdpv5/adminportal/'},    
    //{ n: 'MyIT-School 學習平台', lnk: 'http://192.168.115.1/it-school/php/login_v5.php3?ran=0.26007299323181043' },
    //{ n: '德育專區', lnk: 'http://macaumoraledu.appspot.com/' },
    //{ n: '德育手機程式', lnk: 'http://macauchamson.appspot.com/ ' },
    //{ n: '抗戰70週年專題', lnk: 'http://vmday70th.appspot.com/' },
    //{ n: 'PISA 練習題', lnk:'http://192.168.101.250/pisa'},
    //{ n: '國內,台灣及澳門地區大學考試參考資料', lnk: 'http://192.168.101.250/uexampaper.php' },
    //{ n: '學習及參考資料', lnk: 'http://192.168.101.250/studingfile.php' },
    //{ n: '實用工具', lnk: 'http://192.168.101.250/utility_tools.php' },
    //{ n: '倉頡', lnk:'/images/Page1.html'},
    //{ n: 'Maths Acco Eval', lnk:'/internal/maths'},
    //{ n: 'mbcapp', lnk:'http://192.168.115.1/mbcapp/editdatali.php'},
];
var exports_m1 = [
];
var exports_m2 = [
    { n: '浸信中學架構及校部資料', lnk: 'http://192.168.101.250/mbcinfo.php' },
    { n: '走火及危機處理', lnk: 'http://192.168.101.250/crisismanagement.php' },
    { n: '行政運作指南', lnk: 'http://192.168.101.250/adminprocedure.php' },
    { n: '內線電話表', lnk: 'http://192.168.101.250/admin_notice/inner_tel_list.pdf' },
    { n: '重要校務通傳、章則福利', lnk: 'http://192.168.101.250/admin_notice/admin-notice-index.htm' },
    { n: '教務工作備忘', lnk: 'http://192.168.101.250/edu_admin_notice/edu-admin-notice-index.htm' },
    { n: '升留級標準', lnk: 'http://192.168.101.250/study_rule/stud_rule-index.htm' },
    { n: '各種表格', lnk: 'http://192.168.101.250/requestform/reqform-index.htm' },
    { n: '剪報資料', lnk: 'http://192.168.101.250/newspaper_collection.php?subpath=' },
    { n: '軟件', lnk: 'http://192.168.101.250/freetools.php' },
    { n: 'MBC公用檔案', lnk: 'http://192.168.101.250/mbcfiles.php' },   
];
var exports_m3 = [
    { n: '教室日誌', lnk: 'http://192.168.101.250/dailylog.php?subpath=' },
    { n: '浸信內部訊息', lnk: 'http://192.168.101.250/mbcintnews.php?subpath=' },
    { n: '訪客預約登記', lnk: 'http://192.168.101.250/qm/QM10101/' },
    { n: '浸信內部訊息看板', lnk: 'http://192.168.101.250/a/newsboard/' },
    { n: '浸信學生訊息看板', lnk: 'http://192.168.101.250/a/newsboard/' },
];
var exports_m4 = [
    //{ n: '學生-成績掃瞄圖片', lnk: 'http://192.168.101.250/a/STUDFILES/SEARCHFORM.php' },
    //{ n: '學生-升留登記', lnk: 'http://192.168.101.250/a/stud_upgrade/stud_upgrade.php' },
    //{ n: '學生-成績登記', lnk: 'http://192.168.101.250/a/MARKUP/' },
    //{ n: '軟件-eschool安裝檔', lnk: 'http://192.168.101.250/eschoololdver/a/ESchoolSetup.msi' },
    //{ n: '軟件-eschool免安裝', lnk: 'http://192.168.101.250/eschoololdver/a/ESchoolW7.zip' },
]; 
$(document).ready(function () {
    for (var i = 0; i < exports_m0.length; i++) { $("#xuexi_mnu").append("<li><a href='" + exports_m0[i].lnk + "'>" + exports_m0[i].n + "</a></li>");  }   
    for (var i = 0; i < exports_m2.length; i++) { $("#xuexiaoform_mnu").append("<li><a href='" + exports_m2[i].lnk + "'>" + exports_m2[i].n + "</a></li>"); }
    for (var i = 0; i < exports_m3.length; i++) { $("#xuewu_mnu").append("<li><a href='" + exports_m3[i].lnk + "'>" + exports_m3[i].n + "</a></li>"); }   
    for (var i = 0; i < exports_m4.length; i++) { $("#inter_mnu").append("<li><a href='" + exports_m4[i].lnk + "'>" + exports_m4[i].n + "</a></li>"); }
    profileUserName = document.getElementById("profileUserNameInfo").innerHTML;  
    profileUserNameId = document.getElementById("profileUserNameId").innerHTML;  
    if (profileUserName) {
        $("#bookingroom_mnu").append("<li><a href='/internal/workgrid'>支援-預訂電腦室</a></li>");
        $("#bookingroom_mnu").append("<li><a href='/internal/bookinglaboratory'>支援-預訂實驗功能室</a></li>"); 
        $("#inter_mnu").append("<li><a href='/internal/attend'>行政-預約訪客登記</a></li>");
        $("#inter_mnu").append("<li><a href='/internal/deptworklog/'>部門-工作日誌</a></li>");
        $("#inter_mnu").append("<li><a href='/internal/worknote'>支援-工作看板</a></li>");             
        $("#inter_mnu").append("<li><a href='/internal/sdlc'>支援-SDLC</a></li>");
        $("#marksys_mnu").append("<li><a href='/internal/markup'>學部-成績表</a></li>");        
        $("#marksys_mnu").append("<li><a href='/internal/discipline'>學部-訓輔記錄</a></li>");
        $("#marksys_mnu").append("<li><a href='/internal/leaveapplication'>學部-請假記錄</a></li>");
        $("#excu_sys_mnu").append("<li><a href='/internal/bookingplayground'>支援-預訂場地</a></li>"); 
        if (profileUserName.indexOf('hoipouwan') >= 0 || profileUserName.indexOf('lammou') >= 0) {
           $("#excu_sys_mnu").append("<li><a href='/internal/execudept/familySchComm'>行政-家校通訊</a></li>"); 
           $("#excu_sys_mnu").append("<li><a href='/internal/execudept/mngstudphoto'>行政-學生證照片</a></li>");          
           $("#excu_sys_mnu").append("<li><a href='/internal/markup/mark_report_mrs_course_list'>學部-課程列表</a></li>");
        }
        $("#excu_sys_mnu").append("<li><a href='/internal/execudeptStdImage/photoAddition'>行政-學生證照片</a></li>");           
        $("#excu_sys_mnu").append("<li><a href='/internal/GridStafEval'>行政-職員評核</a></li>");           
        if (profileUserName.indexOf('hoipouwan') >= 0 || profileUserName.indexOf('lammou') >= 0||profileUserNameId.indexOf('2007033') >= 0) {
            $("#inter_mnu").append("<li><a href='/internal/kideval'>幼部-評估表</a></li>");
            $("#marksys_mnu").append("<li><a href='/internal/dashboard/markreportlistnodejs'>學部-補印成績表MR</a></li>");
            $("#inter_mnu").append("<li><a href='/internal/kidevaladmission/admissionformQuery'>幼部-打印表格</a></li>");
            $("#inter_mnu").append("<li><a href='/internal/markup/kidsreport'>幼部-成績表</a></li>");
        }
    }
});