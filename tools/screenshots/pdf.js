let fs = require("fs");
let PDFDocument = require("pdfkit");
let sizeOf = require("image-size");
let ora = require("ora");
const bannertypeArray = [
  "unbranded-1"
];

var j = 0, length = bannertypeArray.length;
for (; j < length; j++) {
let devices = [
  {
    type: "emails",
    name: "emails",
    dpi: 1
  },
];
let createdPdf = false;
let doc;
const spinner = ora("emails: calculating letiables").start();
spinner.color = "red";
spinner.text = "Making PDF...";

devices.forEach(function(device) {
  let images = [];
  let Name = "unbranded 1";

  if(this.bannertypeArray ==  "unbranded-1"){
    images = getFiles("./tools/screenshots/output/" + device.name + "/unbranded-1");
  }

  images.forEach(function (item, i) {
    const imageWidth = parseInt(sizeOf(item).width / 2); // sizeOf(images[index]).width;
    const imageHeight = parseInt(sizeOf(item).height / 2);  //sizeOf(images[index]).height ;
    let imgSize1 = [imageWidth + 400, imageHeight + 400];
    let imgSize2 = [imageWidth, imageHeight];
    const borderWidth = 2; // Set the border width
    const borderColor = "black"; // Set the border color
    // Calculate the coordinates for the image and border
    const imageX = 200; // Set the X coordinate of the image in the PDF
    const imageY = 200; // Set the Y coordinate of the image in the PDF
    const borderX = imageX - 1; // Adjust the X coordinate to include the left border
    const borderY = imageY - 1; // Adjust the Y coordinate to include the top border
    const totalImageWidth = imageWidth + borderWidth; // Adjust the width to include both left and right borders
    const totalImageHeight = imageHeight + borderWidth;

    let imgObj = {
      pdfConfig: {
        size: imgSize1,
        margin: 200, // Top, Right, Bottom, Left (all values set to 50)
        // layout: "portrait",
        // autoFirstPage: true,
        // bufferPages: true,
      },
      imgConfig: {
        fit: imgSize2
      }
    };

    let Dimensions = "";
    if (Name === "unbranded 1") {
      if (imageWidth == "600") {
        if (i === 1) {
          Dimensions = "";
        }
      }
      if (imageWidth == "375") {
        Dimensions = "";
      }
    }

    if (!createdPdf) {
      doc = new PDFDocument(imgObj.pdfConfig)
        .image(item, imgObj.imgConfig)
        .font('Helvetica-Bold')
        .fontSize(13)
        if (Name === "unbranded 1") {
          doc.text(Dimensions, borderX, 80);
        }
      doc.strokeColor(borderColor)
        .lineWidth(borderWidth)
        .rect(borderX, borderY, totalImageWidth, totalImageHeight)
        .stroke();
      createdPdf = true;
    } else {
      doc.addPage(imgObj.pdfConfig)
        .image(item, imgObj.imgConfig)
        .font('Helvetica-Bold')
        .fontSize(13)
        if (Name === "unbranded 1") {
          doc.text(Dimensions, borderX, 80);
        }
      doc.strokeColor(borderColor)
        .lineWidth(borderWidth)
        .rect(borderX, borderY, totalImageWidth, totalImageHeight)
        .stroke();
    }
  })
}, { bannertypeArray: bannertypeArray[j]} );
doc.pipe(
  fs.createWriteStream(
    "./tools/screenshots/output/lilly-lebrikizumab-expert-perspectives-w24-525-"+bannertypeArray[j]+"-email.pdf"
  )
);

doc.end();
spinner.info('See "./tools/screenshots/output" folder for sources');
}
// Function
function getFiles(dir, files_) {
  files_ = files_ || [];
  let files = fs.readdirSync(dir);
  for (let i in files) {
    if (!files[i].includes(".DS_Store")) {
      let name = dir + "/" + files[i];
      if (fs.statSync(name).isDirectory()) {
        getFiles(name, files_);
      } else {
        files_.push(name);
      }
    }
  }
  return files_;
}
