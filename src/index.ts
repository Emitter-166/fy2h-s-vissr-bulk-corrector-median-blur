import fs from 'fs/promises';
import consola from "consola";
import path from 'path';
import {exec} from 'child_process';

const dir_in = "/home/emi/Desktop/sat_recs/fy-2h/10-11-24";
const dir_out = "/home/emi/Desktop/sat_recs/fy-2h/10-11-24/all";


const do_all = async () => {
    const folders = await fs.readdir(dir_in);
    let i = 1;
    for(let folder of folders){
        consola.info(`Processing folder ${i}`);
        const folder_path = path.join(dir_in, folder);
        const output_path = path.join(dir_out, `${i}.jpg`);
        await process_live_output(folder_path, output_path);
        consola.success(`Done processing folder ${i}`);
        i++;
    }
}
const process_live_output = async (dir: string, dest: string) => {
    /*
        Steps:
        1. run the py script for the s-vissr file
        2. run the corrected s-vissr file through satdump
        3. run it through imagemagik with convert -median 
        4. Copy the image and paste it to the destination
    */
    consola.info(`Processing ${dir}`);

    // step 1: run py script on s-vissr file
    let files = (await fs.readdir(dir)).filter(v => v.endsWith("svissr"));
    if(files.length === 0){
        consola.error(`No .vissr file found in ${dir}`);
        return;
    }

    const svissr_path = path.join(dir, files[0]);
    const corrector_command = `python3 script.py -i "${svissr_path}" -o "${path.join(dir, "a.svissrcorrected")}"`;

    consola.info(`Running command: ${corrector_command}`);

    let corrector_cmd_result = false;
    try{
        corrector_cmd_result = await run(corrector_command);
    }catch(err: any){
        consola.error("Error while running correction command");
        console.log(err);
    }

    if(corrector_cmd_result){
        consola.success("Successfully corrected svissr");
    }else{
        consola.error("Correction unsuccessful");
    }

    const corrected_path = path.join(dir, "a.svissrcorrected")

    // step 2 run it through satdump
    const decoded_dir = path.join(dir, "decoded");
    const satdump_cmd = `satdump fengyun_svissr svissr "${corrected_path}" "${decoded_dir}"`;
    consola.info(`Running command: ${satdump_cmd}`);


    let satdump_cmd_result = false;
    try{
        satdump_cmd_result = await run(satdump_cmd);
    }catch(err: any){
        consola.error("Error while running satdump command");
        console.log(err);
    }

    if(satdump_cmd_result){
        consola.success("Successfully decoded svissr");
    }else{
        consola.error("Decoding unsuccessful");
    }

    //finding the image path
    files = await fs.readdir(path.join(decoded_dir, "IMAGE"));
    if(files.length === 0) {
        consola.error("No decoded image folder for some reason");
        return;
    }

    const holder_file = files[0];
    files = await fs.readdir(path.join(decoded_dir, "IMAGE", holder_file));
    if(files.length === 0) {
        consola.error("No decoded images for some reason");
        return;
    }

    let decoded_pic_path = files.find(v => v.includes("FC"));
    if(decoded_pic_path != undefined){
        consola.error("No full composit");
    }
    decoded_pic_path = path.join(decoded_dir, "IMAGE", holder_file, decoded_pic_path as string);

    //Step 3: run it through ImageMagik Median blur

    const final_pic_path = path.join(dir, "final.jpg");
    const median_blur_cmd = `convert -monitor "${decoded_pic_path}" -median 3 "${final_pic_path}"`;

    consola.info(`Running command: ${median_blur_cmd}`);


    let median_blur_cmd_result = false;
    try{
        median_blur_cmd_result = await run(median_blur_cmd);
    }catch(err: any){
        consola.error("Error while running median blur command");
        console.log(err);
    }

    if(median_blur_cmd_result){
        consola.success("Successfully added median blur to image");
    }else{
        consola.error("Adding median blur unsuccessful");
    }

    await fs.copyFile(final_pic_path, dest);

    //cleanup
    files = await fs.readdir(dir);
    const to_delete = files.filter(v => {
        if(v.includes("svissr")) return false;
        if(v === "final.jpg") return false;

        return true;
    }).map(v => path.join(dir, v));

    consola.warn(`Cleaning up: ${to_delete.join(", ")}`);
    
    for(let folder of to_delete){
        await run(`rm -r "${folder}"`)
    }

    consola.success("Done")
}


const run = (command: string) => {
    return new Promise<boolean>((res, rej) => {
        const process = exec(command);

        process.stdout?.on('data', (data) => {
            console.log(data.toString());
        });

        process.stderr?.on('data', (data) => {
            console.error(data.toString());
        });

        process.on('close', (code) => {
            if (code === 0) {
                res(true);
            } else {
                rej(false);
            }
        });

        process.on('error', (err) => {
            rej(err);
        });
    });
}

const half_size_all = async () => {
    const files = await fs.readdir(dir_out);

    const out_folder_path = path.join(dir_out, "half_size");

    let i = 1;
    for(let file of files){
        consola.info("Running file: " + i);
        await run(`convert -monitor ${path.join(dir_out, file)} -resize 50% -quality 85% ${path.join(out_folder_path, file)}`);
        i++;
    }
}

const crop_first_57_percent = async () => {
    const files = await fs.readdir(dir_out);
    const out_folder_path = path.join(dir_out, 'first_57_percent');

    // Create output folder if it doesn't exist
    await fs.mkdir(out_folder_path, { recursive: true });

    let i = 1;
    for (let file of files) {
        const inputPath = path.join(dir_out, file);
        const outputPath = path.join(out_folder_path, file);

        consola.info(`Processing file ${i}: ${file}`);

        // Crop the first 57% of the image
        await run(`convert -monitor ${inputPath} -gravity North -crop 100%x54.5% +repage -resize 75% -quality 85% ${outputPath}`);

        i++;
    }

    consola.success("Cropping completed for all files.");
};

// do_all();
// half_size_all();
crop_first_57_percent();