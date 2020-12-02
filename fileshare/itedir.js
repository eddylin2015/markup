'use strict'
var fs = require( 'fs' );
var path = require( 'path' );
// In newer Node.js versions where process is already global this isn't necessary.
var process = require( "process" );
const  cp= require('child_process');

var moveFrom = "d:/code/";
var moveTo = "d:/out"
var li= new Array(); 
var vIntervalTimer;
// Loop through all the files in the temp directory
var itedir=function(moveFrom){
     
    fs.readdir( moveFrom, function( err, files ) {
        if( err ) {
            console.error( "Could not list the directory.", err );
            process.exit( 1 );
        } 
        files.forEach( function( file, index ) {
                // Make one pass and make the file complete
                var fromPath = path.join( moveFrom, file );
                var toPath = path.join( moveTo, file );
                fs.stat( fromPath, function( error, stat ) {
                    if( error ) {
                        console.error( "Error stating file.", error );
                        return;
                    }
                    if( stat.isFile() ){
                        console.log( "copy \"%s\" \"%s\"", fromPath,toPath);
                        if(fromPath.indexOf('SC2D')>0){
                        }
                        else if(fromPath.indexOf('SG1')>0||fromPath.indexOf('SG2')>0||fromPath.indexOf('SG3')>0)
                        {
                        // cp.spawnSync('docConvert2docxdocx.vbs',[fromPath,toPath]);    
                        //  cp.exec('docConvert2docxdocx.vbs '+fromPath+' '+toPath, (err, stdout, stderr) => { });
                        //}else{
                            li.push(fromPath);
                        }
                    }
                    else if( stat.isDirectory() ){
                        itedir(fromPath);
                    }            
                } );
        } );
} );
}
itedir(moveFrom);

                            
                    /*
                    fs.rename( fromPath, toPath, function( error ) {
                        if( error ) {
                            console.error( "File moving error.", error );
                        }
                        else {
                            console.log( "Moved file '%s' to '%s'.", fromPath, toPath );
                        }
                    } );*/

