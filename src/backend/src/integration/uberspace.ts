import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadBuildInfo():{buildtime:string, branch:string, commit:string}
{
    var buildInfoFilePath = path.join(__dirname, '../../buildinfo.json');
    if (fs.existsSync(buildInfoFilePath)) {
        try {
            var content = fs.readFileSync(buildInfoFilePath, 'utf8');
            var buildInfo = JSON.parse(content);
            return buildInfo;
        } catch (e) {
            return {buildtime:'unknown', branch:'unknown', commit:'unknown'};
        }
    } else {
        console.warn('Build info file not found:', buildInfoFilePath);
        return {buildtime:'unknown', branch:'unknown', commit:'unknown'};
    }
}

export function loadConfig(configFileName:string): {
    [category:string]:{[item:string]:string}
} | null{

    var thisFolder = __dirname;
    configFileName = configFileName || '.my.cnf'
    var foldersToGoUpMax = 5;

    while (foldersToGoUpMax > 0) {
        var configFilePath = path.join(thisFolder, configFileName);
        if (fs.existsSync(configFilePath)) {
            break;
        }
        thisFolder = path.join(thisFolder, '..');
        foldersToGoUpMax--;
    }

    if (foldersToGoUpMax <= 0) {
        return null;
    }
    var fileName = path.join(thisFolder, configFileName);
    
    try{
        var content = fs.readFileSync(fileName, 'utf8');
        var lines = content.split('\n');
        var config: {[category:string]:{[item:string]:string}} = {};
        var currentCategory = '';
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.length === 0 || line.startsWith('#')) {
                continue; // Skip empty lines and comments
            }
            if (line.startsWith('[') && line.endsWith(']')) {
                currentCategory = line.substring(1, line.length - 1).trim();
                config[currentCategory] = {};
            } else {
                var [key, value] = line.split('=').map(part => part.trim());
                if (currentCategory) {
                    config[currentCategory][key] = value;
                }
            }
        }
        return config;
    }
    catch (e) {
        console.error('Error reading config file:', e);
        return null;
    }
}
