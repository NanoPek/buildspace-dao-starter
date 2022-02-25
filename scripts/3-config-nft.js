import sdk from "./1-initialize-sdk.js";
import { readFileSync } from "fs";

const bundleDrop = sdk.getBundleDropModule(
    "0x57c10d8B4626065D1d67B58EBe3324F0A9a339A0",
);

(async () => {
    try {
        await bundleDrop.createBatch([
            {
                name: "Your Own Yoshi Mount",
                description: "This NFT will allow you to ride your own Yoshi (he seems in bad shape), giving you access to Kirby's DAO!",
                image: readFileSync("scripts/assets/yoshi.png"),
            },
        ]);
        console.log("✅ Successfully created a new NFT in the drop!");
    } catch (error) {
        console.error("failed to create the new NFT", error);
    }
})()