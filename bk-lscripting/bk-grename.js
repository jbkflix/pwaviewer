import * as fs from 'fs';


console.log("Processing rename")
var bkconfig = loadConfig('bk-scripting-config.json');
var prefixTitle = process.argv[2];
renameFiles(prefixTitle,bkconfig);

function renameFiles(prefixTitle,cfg){
    var renameDir  = cfg.folders.GRename;
    var stats,nname,fec,from_file,to_file;
    var fileList = fs.readdirSync(renameDir);
    for (var file of fileList) {
        console.log(file);
        stats = fs.statSync(renameDir+"/"+file);
        fec = stats.birthtime;
        nname = "#"+fec.getFullYear()+":";
       if (fec.getMonth()+1<10) nname = nname+"0";
        nname = nname+(fec.getMonth()+1)+":";
        if (fec.getDate()<10) nname = nname+"0";
        nname = nname+fec.getDate()+" ";

        nname = nname + prefixTitle + file ; 
        if (!file.startsWith("#202")) {
            from_file = renameDir+"/"+file;
            to_file = renameDir+"/"+nname;
            fs.renameSync(from_file,to_file);
            console.log("Renaming: "+nname);
        }
        
    }
}


function loadConfig(fl) {
    try {
      var data = fs.readFileSync(fl, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(err);
      return null;
    }
}