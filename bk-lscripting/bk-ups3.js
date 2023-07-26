import * as fs from 'fs';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";


console.log("Processing BK --> S3")
var bkconfig = loadConfig('bk-scripting-config.json');
moveToUpload(bkconfig);
processUploadFolder(bkconfig);




async function processUploadFolder(cfg){
    console.log("Uploading to S3");
    var toUp_folder = cfg.folders.S3ToUpload;
    var toUnknow_folder = cfg.folders.S3Unknow;
    var toUploaded_folder = cfg.folders.S3Uploaded;
    var toError_folder = cfg.folders.S3Error;
    var i=0;
    var rt;
    var fileList = fs.readdirSync(toUp_folder);
    var kv=getTitleFolderKeyValue();
    var foundIt=null;
    var countS3=0;
    var countUnknow=0;
    var to_errorfile,from_file,to_file,partial_filename,s3file;
    for (var file of fileList) {
        partial_filename = file.substring(12)
        foundIt=null;
        for (var k in kv) {
            if (partial_filename.startsWith(k)) {
                foundIt=k;
                break;
            }
        }
        if (foundIt!=null) {
            from_file = toUp_folder+file;
            to_file = toUploaded_folder+file;
            to_errorfile = toError_folder+file;
            s3file = kv[foundIt]+"/"+file;
            rt = await uploadToS3(from_file,s3file,bkconfig);
            if (rt) {
                fs.renameSync(from_file,to_file);
                countS3++;
            } else
            {
                fs.renameSync(from_file,to_errorfile);
                countS3++;
            }
        } else {
            from_file = toUp_folder+file;
            to_file = toUnknow_folder+file;
            fs.renameSync(from_file,to_file);
            countUnknow++;
        }
       
    }
    console.log("Uploaded to S3 "+countS3.toString()+" files");
    console.log("Moved to Unknow "+countUnknow.toString()+" files");

    //console.log ("up2");
    //await uploadToS3("dir/dc2.pdf",bkconfig);
    //console.log ("up3");
    //await uploadToS3("dir/dc3.pdf",bkconfig);
}

function moveToUpload(cfg) {
    var down_folder = cfg.folders.Download;
    var toUp_folder = cfg.folders.S3ToUpload;
    var i=0;
    var fileList = fs.readdirSync(down_folder);
    var from_file,to_file;
    for (var file of fileList) {
        if (file.startsWith("#202") && file.endsWith(".mp4")){
            from_file = down_folder+file;
            to_file = toUp_folder+file;
            fs.renameSync(from_file,to_file);
            i++;
        }
    }
    console.log("Moving "+i.toString()+" files to upload folder");
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

function getTitleFolderKeyValue(){
    var kv={};
    kv["Taller de inversores"]="taller-inversores";
    kv["Serendipia"] = "serendipia";
    kv["Escuela de finanzas personales"] = "escuela-finanzas-personales";
    kv["Invertir jugando"] = "invertir-jugando";
    kv["Seminario de valuación de empresas"] = "seminario-valuacion-empresas";
    kv["Taller de desarrollo profesional y emprendimientos"] = "taller-desarrollo-profesional-emprendimientos";
    
    //kv[""] = "";
    //kv[""] = "";
    //kv[""] = "";
    return kv;
}


/// kkkkkkk






async function uploadToS3(from_file,file,cfg) {
    const s3Client = new S3Client({
        region: cfg.S3Info.bkRegion,
        credentials: {
            accessKeyId: cfg.S3Info.user_key,
            secretAccessKey: cfg.S3Info.user_secret,
        },
        requestHandler: new NodeHttpHandler(), // Corrección aquí
    });

    try {
        var filePath = from_file;
        const fileData = fs.readFileSync(filePath);

        const uploadParams = {
            Bucket: cfg.S3Info.bkBucket,
            Key: file,
            Body: fileData,
            ContentType: "application/octet-stream",
            ACL: "private"
        };

        const result = await s3Client.send(new PutObjectCommand(uploadParams));
        console.log("S3 upload:", file);
        return true;
    } catch (error) {
        console.error("S3 upload error: ", error);
        return false;
    }
}