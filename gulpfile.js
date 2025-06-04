"use strict";


// Load plugins
const browsersync = require("browser-sync").create();
const gulp = require("gulp");
const { series } = require("gulp");
const htmlmin = require('gulp-htmlmin');
const rename = require("gulp-rename");
const clean = require("gulp-clean");
const zip = require("gulp-zip");
const path = require("path");
const glob = require("glob");
const replace = require("gulp-replace");

const fs = require("fs");
const subDirs = glob.sync("./dist/*");

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const emailType = packageJson.emailType;


const theDate = new Date();
  const dateOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "US/Eastern",
  };
  const formattedDate = theDate.toLocaleDateString("en-US", dateOptions);

  const fileNameDateOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "US/Eastern",
  };
  let fileNameDate = theDate.toLocaleDateString("en-US", fileNameDateOptions);

  // replace /, (space) and : with -
  fileNameDate = fileNameDate.replace(/\//g, '-').replace(/,/g, '-').replace(/:/g, '-').replace(/\s/g, '');


// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./",
    },
    port: 3000,
  });
  done();
}

// HTML task
function html() {
  return gulp
    .src("./source/**/**/**/*.html")

    .pipe(gulp.dest("./dist"))
    .pipe(browsersync.stream());
}

// Image task
function img() {
  return gulp
    .src(["./source/**/**/*.jpg", "./source/**/**/*.png"])
    .pipe(gulp.dest("./dist"));
}

// Delete build directory if build directory exists
function deleteBuild(done) {
  glob("./dist", function (err, files) {
    if (err) {
      console.error("Error while checking directory:", err);
    } else if (files.length > 0) {
      return gulp.src("./dist", { read: false }).pipe(clean());
    } else {
      console.log("Directory does not exist");
    }
  });
  done();
}

// Delete temp directory if temp directory exists
function deleteTemp(done) {
  glob("./temp", function (err, files) {
    if (err) {
      console.error("Error while checking directory:", err);
    } else if (files.length > 0) {
      return gulp.src("./temp", { read: false }).pipe(clean());
    } else {
      console.log("Directory does not exist");
    }
  });
  done();
}

// Remove email info from email
function removeEmailInfo() {
  const startComment = "<!-- email info component -->";
  const endComment = "<!-- email info component -->";
  return gulp
    .src("./dist/**/*")
    .pipe(
      replace(new RegExp(`${startComment}[\\s\\S]*?${endComment}`, "g"), "")
    )
    .pipe(gulp.dest("./temp"));
}

// Determines whether to process this email as AIG or ELOQUA.  Default to AIG
function processEmailType(done) {
  let task;
  if (emailType === "AIG") {
    task = insertAIGTokens();
  } else {
    task = prepForEloqua();
  }

  done();

  return task;
}

// Prepare email for Elequoa
function prepForEloqua() {
  const startFooterComment = "<!-- footer component -->";
  const endFooterComment = "<!-- footer component -->";
  
  
  return gulp
    .src("./temp/**/*.html")
    .pipe(
      replace(
        /<a\s+id="web-version-link"\s+href=".*?"\s+style="(.*?)">/g,
        '<a href="https://app.info.haymarketmedicalnetwork.com/e/es?s=~~eloqua..type--emailfield..syntax--siteid..encodeFor--url~~&e=~~eloqua..type--emailfield..syntax--elqemailsaveguid..encodeFor--url~~&elqTrackId=efd74c1a1b7a40299e524d6e5aa03bea&elq=~~eloqua..type--emailfield..syntax--recipientid..encodeFor--url~~&elqaid=~~eloqua..type--emailfield..syntax--elqassetid..encodeFor--url~~&elqat=~~eloqua..type--emailfield..syntax--elqassettype..encodeFor--url~~" style="$1">'
      )
    )
    .pipe(
      replace(new RegExp(`${startFooterComment}[\\s\\S]*?${endFooterComment}`, "g"), "")
    )
    .pipe(htmlmin({ 
      collapseWhitespace: true,  // Removes extra spaces and line breaks
      minifyCSS: true,           // Minifies inline CSS
      minifyJS: true             // Minifies inline JavaScript
    }))
    .pipe(gulp.dest("./temp"));
}


// Insert AIG tokens for zip files
function insertAIGTokens() {
  return (
    gulp
      .src("./temp/**/*.html")
      .pipe(
        replace(
          /<a\s+.*?id="recipient-email".*?>(.*?)<\/a>/g,
          '<a href="mailto:$EMAIL$" style="font-family: Arial, sans-serif; font-size: 12px; line-height: 14px; color: #000000; text-decoration: underline;">$EMAIL$</a>'
        )
      )
      .pipe(
        replace(/<span\s+.*?id="current-year".*?>(.*?)<\/span>/g, "$CUR_YEAR$")
      )

      .pipe(
        replace(
          /<a\s+id="web-version-link"\s+href=".*?"\s+style="(.*?)">/g,
          '<a href="$HTTP$://$IP_DOMAIN$/c1/$CAMPAIGN_ID$/$CUSTNO$/$CUSTNO$/~/-108" style="$1">'
        )
      )
      .pipe(
        replace(
          /<a\s+id="update-profile-link"\s+href=".*?"\s+style="(.*?)">/g,
          '<a href="https://lets.go.haymarketmedicalnetwork.com/PreferenceCenter" style="$1">'
        )
      )
      .pipe(
        replace(
          /<a\s+id="unsubscribe-link"\s+href=".*?"\s+style="(.*?)">/g,
          function (match, p1) {
            // Replace & with a placeholder in the href attribute
            const href =
              "$HTTP$://$IP_DOMAIN$/r/r.asp?$CAMPAIGN_ID$&$CUSTNO$&H".replace(
                "&",
                "__AMP__"
              );
            // Construct the replacement string
            return '<a href="' + href + '" style="' + p1 + '">';
          }
        )
      )
      // Replace the placeholder with &
      .pipe(replace(/__AMP__/g, "&"))
      .pipe(htmlmin({ 
        collapseWhitespace: true,  // Removes extra spaces and line breaks
        removeComments: true,      // Removes HTML comments
        minifyCSS: true,           // Minifies inline CSS
        minifyJS: true             // Minifies inline JavaScript
      }))
      .pipe(gulp.dest("./temp"))
  );
}


// Zip up build files for handoff
function zipit(done) {
  const repoPath = path.resolve("../").split("/").pop();
  const tempDirs = glob.sync("./temp/*");

  tempDirs.forEach((tempDirs) => {
    const numberedEmails = glob.sync(tempDirs + "/*");
    numberedEmails.forEach((numberedEmail) => {
      const newName =
        path.parse(repoPath).name +
        "-" +
        path.parse(tempDirs).name +
        "-" +
        path.parse(numberedEmail).name + "-email" + "-" + fileNameDate;

      gulp
        .src(numberedEmail + "/**/*")
        .pipe(zip(newName + ".zip"))
        .pipe(
          rename(function (path) {
            path.basename = newName;
          })
        )
        .pipe(gulp.dest("./dist/zipped"));
    });
  });
  done();
}

// Copy screenshot PDF files into dist
function copyScreenshots() {
  return gulp
    .src("./tools/screenshots/output/*.pdf")
    .pipe(rename(function(path) {
      path.extname = "-" + fileNameDate + ".pdf";
    }))
    .pipe(gulp.dest("./dist/screenshots/"));
}

// Watch and build files
function watchFiles() {
  gulp.watch("./source/**/**/*.html", html);
  gulp.watch("./source/**/**/img/*", img);
}

// Create a function to generate the index HTML content
function generateIndexContent() {
  // name of repo
  const repoName = path.resolve("../").split("/").pop();
  const repoNameClean = repoName.replaceAll("-", " ")

  // clean name of repo
  const repoNameCase = repoNameClean
    .toLowerCase()
    .split(" ")
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

  // Initialize an array to store email links
  const emailLinks = [];

  // Initialize an array to store email texts
  const emailTexts = [];

  // Iterate through all the subdirectories in the "dist" directory
  subDirs.forEach((subDir) => {
    // Find all the directories in each subdirectory
    const emailDirectories = glob.sync(subDir + "/*");

    // Find all the directories excluding zip files
    const htmlOnlyFiles = emailDirectories.filter(
      (file) => path.extname(file) !== ".png" && path.extname(file) !== ".jpg" && path.extname(file) !== ".zip" && path.extname(file) !== ".pdf"
    );

    htmlOnlyFiles.forEach((htmlOnlyFile) => {
      console.log(htmlOnlyFile);
      const emailURL = htmlOnlyFile.replace(/^\.\/dist\//, "");
      const emailText = emailURL.replaceAll("/", " -- ");
      const emailLink = `<a href="${emailURL}/index.html" target="_blank">${emailText}</a>`;
      // Create text for each email and add it to the array
      emailTexts.push(emailText);

      // Create a link for each email and add it to the array
      emailLinks.push(emailLink);
    });
  });

  // zip files
  const zipFiles = glob.sync("./dist/zipped/*.zip");

  const zipLinks = zipFiles.map((zipFile) => {
    const fileName = path.basename(zipFile);
    const link = `<a href="./zipped/${fileName}" download>${fileName}</a>`;
    return link;
  });

  // screenshot files
  const screenshotFiles = glob.sync("./dist/screenshots/*.pdf");

  const screenshotLinks = screenshotFiles.map((screenshotFile) => {
    const fileName = path.basename(screenshotFile);
    const link = `<a href="./screenshots/${fileName}" download="${fileName}">${fileName}</a>`;
    return link; 
  });

  const indexHTMLContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${repoNameCase} Emails</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  </head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
    
    body {
      font-family: "Inter", sans-serif;
      font-size: 1.1rem;
      line-height: normal;
      background-color: #f2f2f2;
      color: #000;
      padding: 3rem 0;
    }
    h1, h2 {
      margin: 0 0 1rem 0;
    }
    h1 {
      font-size: 1.6rem;
      font-weight: 500;
    }
    h2 {
      font-size: 1.4rem;
      font-weight: 400;
    }
    a {
      color: #1778F2;
      transition: all 0.3s ease;
    }
    a:hover {
      color: #000;
      text-decoration: none;
    }
    ul {
      margin: 0;
      padding-left: 23px;
    }
    ul li {
      color: #696969;
      padding: .75rem .5rem;
    }
    ul li:nth-child(odd) {
      background-color: #f2f2f2;
    }
    ul li span {
      color: #000;
    }
    header, footer {
      text-align: center;
      padding: 0 1rem;
    }
    section {
      margin-top: 1rem;
      margin-bottom: 1rem;
    }
    section .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .row {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(2, 1fr);
    }
    .col {
      padding: 2rem 1.5rem;
      border-radius: 15px;
      border: 1px solid #eee;
      background-color: #fff;
      transition: all .2s ease;
    }
    .col-view {
     grid-row: 1 / 3;
    }
    .col-screenshot {
      grid-column: 2 / 3;
    }
    .col:hover {
      box-shadow: 0px 0px 18px 7px rgba(0,0,0,0.1);  
    }
    footer p {
      font-size: .7rem;
    }
    @media screen and (max-width: 600px) {
      .row {
        grid-template-columns: 1fr;
      }
      .col-view {
        grid-row: auto;
      }
      .col-screenshot {
        grid-column: auto;
      }
    }
  </style>
<body>
	<header>
		<h1>${repoNameCase} Emails</h1>
	</header>
	<main>
		<section>
			<div class="container">
				<div class="row">
					<div class="col col-view">
						<h2>
							<i class="fa-solid fa-magnifying-glass"></i> View Emails
						</h2>
						<ul>
              ${emailLinks
                .map(
                  (link) => `
							<li>
								<span>${link}</span>
							</li>`
                )
                .join("\n")}  
						</ul>
					</div>
					<div class="col col-screenshot">
						<h2>
							<i class="fa-solid fa-camera"></i> Download Screenshots
						</h2>
						<ul>
                ${screenshotLinks
                  .map(
                    (link) => `
							<li>
								<span>${link}</span>
							</li>`
                  )
                  .join("\n")}
						</ul>
					</div>
          <div class="col col-zip">
						<h2>
							<i class="fa-solid fa-download"></i> Download Zip Files
						</h2>
						<ul>
                ${zipLinks
                  .map(
                    (link) => `
							<li>
								<span>${link}</span>
							</li>`
                  )
                  .join("\n")}
						</ul>
					</div>
				</div>
			</div>
		</section>
	</main>
	<footer>
		<p>Last updated ${formattedDate} EST</p>
		<p>
			<a href="https://gitlab.com/hm-devs/pri/utilities/${repoName}" target="_blank">GitLab Repository</a>
		</p>
	</footer>
</body></html>
  `;

  return indexHTMLContent;
}

// Task to create the index.html file
function buildIndex(done) {
  const indexHTMLContent = generateIndexContent();
  fs.writeFileSync("./dist/index.html", indexHTMLContent);
  done();
}

// Define complex tasks
const watch = gulp.parallel(html, img, watchFiles, browserSync);

// Export tasks
exports.html = html;
exports.img = img;
exports.copyScreenshots = copyScreenshots;
exports.buildIndex = buildIndex;
exports.watch = watch;

// Run 'gulp build' to build the emails to dist
exports.build = series(deleteBuild, deleteTemp, html, img);


// Run 'gulp pkgIt' to remove subject lines and other sender data, insert AIG tokens and then zip the files
exports.pkgIt = series(
  removeEmailInfo,
  function (cb) {
    setTimeout(() => {
      cb();
    }, 1000); // 1000 milliseconds delay (1 second)
  },
  processEmailType,
  function (cb) {
    setTimeout(() => {
      cb();
    }, 1000); // 1000 milliseconds delay (1 second)
  },
  zipit
);
