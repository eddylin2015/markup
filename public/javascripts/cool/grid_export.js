   var keyStr = "ABCDEFGHIJKLMNOP" +
                "QRSTUVWXYZabcdef" +
                "ghijklmnopqrstuv" +
                "wxyz0123456789+/" +
                "=";
   function encode64(input) {
      var output = "";
      var chr1, chr2, chr3 = "";
      var enc1, enc2, enc3, enc4 = "";
      var i = 0;
      do {
         chr1 = input.charCodeAt(i++);
         chr2 = input.charCodeAt(i++);
         chr3 = input.charCodeAt(i++);
         enc1 = chr1 >> 2;
         enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
         enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
         enc4 = chr3 & 63;
         if (isNaN(chr2)) {
            enc3 = enc4 = 64;
         } else if (isNaN(chr3)) {
            enc4 = 64;
         }
         output = output +
            keyStr.charAt(enc1) +
            keyStr.charAt(enc2) +
            keyStr.charAt(enc3) +
            keyStr.charAt(enc4);
         chr1 = chr2 = chr3 = "";
         enc1 = enc2 = enc3 = enc4 = "";
      } while (i < input.length);
      return output;
   }
   function decode64(input) {
      var output = "";
      var chr1, chr2, chr3 = "";
      var enc1, enc2, enc3, enc4 = "";
      var i = 0;
      // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
      var base64test = /[^A-Za-z0-9\+\/\=]/g;
      if (base64test.exec(input)) {
         alert("There were invalid base64 characters in the input text.\n" +
               "Valid base64 characters are A-Z, a-z, 0-9, ��+��, ��/��, and ��=��\n" +
               "Expect errors in decoding.");
      }
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      do {
         enc1 = keyStr.indexOf(input.charAt(i++));
         enc2 = keyStr.indexOf(input.charAt(i++));
         enc3 = keyStr.indexOf(input.charAt(i++));
         enc4 = keyStr.indexOf(input.charAt(i++));
         chr1 = (enc1 << 2) | (enc2 >> 4);
         chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
         chr3 = ((enc3 & 3) << 6) | enc4;
         output = output + String.fromCharCode(chr1);
         if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
         }
         if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
         }
         chr1 = chr2 = chr3 = "";
         enc1 = enc2 = enc3 = enc4 = "";
      } while (i < input.length);
      return output;
   }
	 
function exportDataAns(evaldata) {
	var txt="";
	for (var i = 0; i < evaldata.length; i++) 
	{
	     for(var j=0;j<evaldata[i].length;j++)    
	     {
		txt=txt+evaldata[i][j]+",";
	     }	
	     txt=txt+ '\r\n';
	}
	var exportLink = document.createElement('a');
  	exportLink.setAttribute("download","data.csv");
	try
	  {
  	    //exportLink.setAttribute('href',  window.btoa(txt));
	  	exportLink.setAttribute('href', 'data:text/csv;base64,' + window.btoa(txt));
	  }
	catch(err)
	  {
  	  	exportLink.setAttribute('href', 'data:text/csv;base64,' + encode64(txt));
	  }
	exportLink.appendChild(document.createTextNode('data.csv'));
	document.getElementById('CSVFrm_Link').appendChild(exportLink);
}

function utf8_to_b64( str ) {
  return window.btoa(unescape(encodeURIComponent( str )));
}
function b64_to_utf8( str ) {
  return decodeURIComponent(escape(window.atob( str )));
}
function wutf8_to_b64( str ) {
	// return $.base64.encode(unescape(encodeURIComponent( str )));
	 return $.base64.encode(unescape(encodeURIComponent( str )));
}
function wb64_to_utf8( str ) {
	// return $.base64.encode(unescape(encodeURIComponent( str )));
	 return decodeURIComponent(escape($.base64.decode( str )));
}

function exportDataTbl(divtag_id) {
    var txt = document.getElementById(divtag_id).innerHTML;
    //alert("0:"+txt);
    excelhead = '<HTML xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">\n<head><meta http-equiv="content-type" content="application/vndms-excel; charset=UTF-8"></head>\n<body>\n';
    excelend = '</body></html>';
    txt = excelhead
        + "<table>"
        + txt
        + "</table>"
        + excelend;
    /*var exportLink = document.createElement('a');
    var txt = document.getElementById(divtag_id).innerHTML;
    if (true) {
        var copytxt = "<table>";
        $('#EDUTBL tr').each(function () {
            copytxt = copytxt + "<tr>";
            $(this).find('td').each(function () {
                var cellinnerHTML = $(this).text();
                copytxt = copytxt + "<td>" + cellinnerHTML + '</td>';
            })
            copytxt = copytxt + "</tr>";
        })
        txt = copytxt + "</table>";
    }*/   
    document.getElementById('CSVFrmPOSTVALUE').value = txt;
    document.getElementById('CSVFrmPOST').submit();
}
function exportData(divtag_id,filename,Link_id,htmlfmt) {
     var txt=document.getElementById(divtag_id).innerHTML ;
     
     //alert("1:"+txt);
     excelhead='<HTML xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">\n<head><meta http-equiv="content-type" content="application/vndms-excel; charset=UTF-8"></head>\n<body>\n';
     excelend='</body></html>';
     txt=excelhead +txt +excelend;     
     var exportLink = document.createElement('a');
	 
     
     /*try
     {
	  exportLink.setAttribute('href', 'data:text/csv;base64,' + utf8_to_b64(txt));
	  exportLink.setAttribute("download",filename);
	  exportLink.click();
      }
      catch(err)
      {*/
	  if(htmlfmt=='htmlfmt'){
       txt=document.getElementById(divtag_id).innerHTML ;
      }
      //alert("2:"+txt);
      else
      {
	    var copytxt="<table>";
	    $('#EDUTBL tr').each(function(){
        copytxt=copytxt+"<tr>";
        $(this).find('th').each(function(){
			var cellinnerHTML=$(this).text();
			copytxt=copytxt+"<td>"+cellinnerHTML+'</td>';
		})
		$(this).find('td').each(function(){
			var cellinnerHTML=$(this).text();
			copytxt=copytxt+"<td>"+cellinnerHTML+'</td>';
		})
		copytxt=copytxt+"</tr>";
		})
		txt=copytxt+"</table>";
        }
		
	  
		//var txt=document.getElementById(divtag_id).innerHTML ;
		
		document.getElementById('CSVFrmPOSTVALUE').value=txt;
		document.getElementById('CSVFrmPOST').submit();
        //}
	exportLink.appendChild(document.createTextNode(filename));
	document.getElementById(Link_id).appendChild(exportLink);
}
	function closeedit()
	{
		$('.M').each(function(i)
		{
			if($(this).has(":input").length==0){
			}else{
				input=$(this).children();
				strv=input.val();
				$(this).text(strv);
				input.remove();				
			}
		});
    }
    function showClassTag(x,tbl){
       if(x=="all"){
        $( '#'+tbl ).find('tr').each(function() {
            if( $( this ).css("display")=="none"){
                $( this ).css("display", "block");
            }else{
                $( this ).css("display", "none");
            }
          });
       }else{
        if($('.'+x).css("display")=="none"){
          $('.'+x).css("display","block");
        }else{
           $('.'+x).css("display","none");
        }
       }
    }

	
