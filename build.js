const child_process = require(`child_process`);
const fs = require(`fs`);
const which = require('which')

// previous store: electron-builder -c ./package-build-store.json -p never
// previous dist: electron-builder -c ./package-build.json -p always

const commitHash = child_process.execSync(`git rev-parse --short HEAD`).toString().trim();

const config = {
    "appId": "dev.sylviiu.ezytdl",
    "productName": "ezytdl",
    "artifactName": "${productName}-${platform}-${version}.${ext}",
    "portable": {
        "artifactName": "${productName}-${platform}-portable-${version}.${ext}"
    },
    "win": {
        "icon": "res/packageIcons/icon-512x512.ico",
        "target": [
            "nsis"
        ]
    },
    "linux": {
        "icon": "res/packageIcons/icon-512x512.png",
        "category": "Utility",
        "target": [
            "tar.gz",
            "AppImage",
        ]
    },
    "mac": {
        "icon": "res/packageIcons/icon.icns",
        "category": "public.app-category.utilities",
        "target": [
            "dmg",
        ]
    },
    "asar": true,
    "asarUnpack": [
        "res/*.mp4",
        "res/**/*"
    ],
    "files": [
        "html/*.html",
        "html/assets/**/*",
        "html/topjs/*",
        "html/afterload/*",
        "html/util/*",
        "html/pagescripts/*",
        "html/scripts/*",
        "node_modules/**/*",
        "res/*.*",
        "res/trayIcons/*",
        "res/packageIcons/*",
        "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
        "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
        "!**/node_modules/*.d.ts",
        "!**/node_modules/*.bin",
        "!**/node_modules/*.exe",
        "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
        "!.editorconfig",
        "!**/._*",
        "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
        "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
        "!**/{appveyor.yml,.travis.yml,circle.yml}",
        "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}",
        "res/*.mp4",
        "dist/trayIcons/*",
        "package.json",
        "index.js",
        "init.js",
        "build-init.json",
        "init/*.js",
        "server.js",
        "getConfig.js",
        "defaultConfig.json",
        "configStrings.json",
        "configDescriptions.json",
        "util/*.js",
        "util/*.json",
        "util/*/*.js",
        "core/*.js",
        "core/*.json",
        "core/ipc/*/*.js",
        "core/depcheck/*/*.js",
        "core/depcheck/*.js",
        "core/*.js",
        "devscripts/testrun.js",
        "devscripts/*/*.js",
        "checks/*.js"
    ],
    "extraMetadata": {
        buildDate: Date.now(),
        commitHash,
        fullCommitHash: child_process.execSync(`git rev-parse HEAD`).toString().trim(),
    },
};

const pkg = JSON.parse(fs.readFileSync(`./package.json`).toString());

which(`npm`).then(async npm => {
    if(process.argv.find(s => s == `test`)) {        
        const spawnProc = (path, cwd) => {
            const spawnPath = path == `npm` ? npm : path;

            console.log(`Spawning ${spawnPath} at cwd ${cwd}`);
    
            const proc = child_process.spawn(spawnPath, path == `npm` ? [`start`, `--`, `--testrun`] : [`--testrun`], { cwd });
    
            let passed = false;
    
            const data = data => {
                const str = data.toString().trim();
                console.log(str);
    
                if(str.includes(`TESTRUN PASSED.`)) {
                    console.log(`Passed testrun!`);
                    passed = true;
                }
            }
    
            proc.stdout.on(`data`, data);
            proc.stderr.on(`data`, data);
    
            proc.on(`error`, (err) => {
                console.log(`Testrun errored with ${err}`);
                process.exit(1);
            })
    
            proc.on(`close`, (code) => {
                const exitWithCode = passed ? 0 : 1
                console.log(`Testrun closed with code ${code}; exiting with code ${exitWithCode}`);
                process.exit(exitWithCode);
            });
        }
    
        if(process.argv.find(s => s == `--from-source`)) {
            console.log(`Running from source...`)
            spawnProc(`npm`, __dirname)
        } else {
            console.log(`packing...`)
            child_process.execFileSync(await which(`node`), [`build`, `pack`], { stdio: "inherit" });
            console.log(`packed!`);

            if(process.platform == `darwin`) {
                spawnProc(require(`path`).join(__dirname, `dist`, `mac`, `ezytdl.app`, `Contents`, `MacOS`, `ezytdl`), require(`path`).join(__dirname, `dist`))
            } else {
                const folder = fs.readdirSync(`./dist`).find(s => s.endsWith(`-unpacked`) && fs.existsSync(`./dist/` + s + `/`));
            
                if(!folder) {
                    console.log(`No unpacked folder found!`);
                    process.exit(1);
                } else {
                    console.log(`Found unpacked folder ${folder}!`);
            
                    const file = fs.readdirSync(`./dist/${folder}/`).find(s => s.startsWith(`ezytdl`));
            
                    if(!file) {
                        console.log(`No file found!`);
                        process.exit(1);
                    } else {
                        console.log(`Found file ${file}!`);
            
                        const cwd = require(`path`).join(__dirname, `dist`, folder)
                        const path = require(`path`).join(cwd, file);
            
                        spawnProc(path, cwd)
                    }
                }
            }
        }
    } else {
        console.log(`Building for ${process.platform}... (${process.env["CSC_LINK"] && process.env["CSC_KEY_PASSWORD"] ? "SIGNED" : "UNSIGNED"})`);
        
        if(process.argv.find(s => s == `store`)) {
            console.log(`Using store compression...`);
            config.compression = "store";
        } else {
            console.log(`Using maximum compression...`);
            config.compression = "maximum";
        }
        
        if(process.argv.find(s => s == `noasar`)) {
            console.log(`Disabling asar...`);
            config.asar = false;
        }
        
        if(process.argv.find(s => s == `publish`)) {
            console.log(`Publishing...`);
            config.publish = {
                "provider": "github",
                "owner": "sylviiu",
                "repo": "ezytdl",
                "vPrefixedTagName": false,
                "releaseType": "draft"
            };
        } else if(process.argv.find(s => s == `nightly`)) {
            console.log(`Using nightly build...`);
        
            config.extraMetadata.version = `${pkg.version}-nightly.${commitHash}`;
        
            config.productName += `-nightly`;
        
            config.appId += `nightly`;
            
            config.publish = {
                "provider": "github",
                "owner": "sylviiu",
                "repo": "ezytdl",
                "vPrefixedTagName": false,
                "releaseType": "draft"
            };
        }
        
        fs.writeFileSync(`./build.json`, JSON.stringify(config, null, 4));
        
        console.log(`Wrote config!`);

        const buildScripts = fs.readdirSync(`./buildscripts`).filter(f => f.endsWith(`.js`));

        console.log(`Running build ${buildScripts.length} scripts...`);

        for(const script of buildScripts) {
            console.log(`Running build script ${script}...`);
            await require(`./buildscripts/${script}`)();
            console.log(`Completed build script ${script}!`);
        }
        
        console.log(`Spawning npm at ${npm}`);
        
        const proc = child_process.spawn(npm, [`run`, `electron-builder`, `--`, `-c`, `./build.json`, ...(process.argv.find(s => s == `pack`) ? [`--dir`] : []), ...(config.publish ? [`-p`, `always`] : [`-p`, `never`])], { stdio: "inherit" });
        
        proc.on(`close`, (code) => {
            console.log(`Build closed with code ${code}`);
        
            if(fs.existsSync(`./build.json`)) fs.unlinkSync(`./build.json`);
        })
    }
})