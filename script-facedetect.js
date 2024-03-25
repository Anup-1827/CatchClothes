const CanvasConfig = {
  showcanvas: "false",
  canvasscalex: 1,
  canvasscaley: 1,
  canvasx: 0,
  canvasy: 0,
};

const assetsStyling = {
  assetwidth: "35",
  assetheight: "35",
  bucketwidth: "64",
  bucketheight: "64",
};

const customStyling = `
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  #mainDivElement {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    width: fit-content;
  }
  
  #videoElementId {
    // transform: matrix(-1, 0, 0, 1, 0, 0);
    object-fit: cover;  
  }
  
  #bucketDiv {
    position: absolute;
    bottom: 15%;
    display: flex;
    z-index: 1;
  }
  
  #bucketDiv #poof {
    position: absolute;
    display: none;
    top: -23px;
    right: 8px;
  }
  
  #fallingObjectDiv, #canvasDiv {
    position: absolute;
    top: 0;
  }
  
  #caughtMessage {
    width: 100%;
    min-height: 50px;
    text-align: center;
    background: white;
    z-index: 1;
    font-weight: bold;
    font-size: 30px;
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    visibility: hidden;
  }
  
  #loadingDivMain{
    /* display: none; */
  }
  
  #loadingDiv {
    display: inline-block;
    text-align: center;
    width: 80px;
    height: 80px;
    position: absolute;
    top: 50%;
    transform: translate(0, -50%);
  }
  
  #loadingDiv:after {
    content: " ";
    display: block;
    width: 64px;
    height: 64px;
    margin: 8px;
    border-radius: 50%;
    border: 6px solid #fff;
    border-color: #fff transparent #fff transparent;
    animation: lds-dual-ring 1.2s linear infinite;
  }
  
  #loadingDivText{
    font-weight: bold;
    color: white;
  }
  @keyframes lds-dual-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }  
`;

// Starting Video for WebCam
function startVideo(video) {
  if (navigator?.mediaDevices?.getUserMedia) {
    window.navigator.getUserMedia(
      {
        video: {},
      },
      (stream) => (video.srcObject = stream),
      (err) => console.error(err)
    );

    return true;
  } else {
    alert("GetUserMedia is Not Supported");
    return false;
  }
}

// LoadModel
function loadModel(context, canvasDiv) {
  faceLandmarksDetection
    .load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
      runtime: "mediapipe",
      solutionPath: "facemesh.js",
      // solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
      maxFaces: 1,
      scale: 0.8,
    })
    .then((mdl) => {
      context.model = mdl;
      // console.log(mdl);
      context.ctx = canvasDiv.getContext("2d");
      context.shadowRoot.getElementById("loadingDivText").innerText =
        "Modal Loaded....";
      if (context.clearDetectorInterval) {
        clearInterval(context.clearDetectorInterval);
      }
      context.clearDetectorInterval = setInterval(() => {
        detector(context, context.model);
      }, 100);
    });
}

// Detect Face
async function detector(context, net) {
  const video = context.shadowRoot.getElementById("videoElementId");
  const videowidth = context.getAttribute("videowidth") || "640";
  const videoheight = context.getAttribute("videoheight") || "480";

  video.width = videowidth;
  video.height = videoheight;

  // Canvas Div
  const canvas = context.shadowRoot.getElementById("canvasDiv");
  canvas.width = videowidth;
  canvas.height = videoheight;

  // Setting the width and height of the Falling Object Div
  const fallingObjectDiv =
    context.shadowRoot.getElementById("fallingObjectDiv");
  fallingObjectDiv.style.width = `${videowidth}px`;
  fallingObjectDiv.style.height = `${videoheight}px`;

  // Create Detection
  const faces = await net.estimateFaces({
    input: video,
    flipHorizontal: false,
    returnTensors: false,
    predictIrises: false,
  });
  console.log(faces[0]);
  if (faces.length > 0) {
    // Loading
    context.shadowRoot.getElementById("loadingDivText").innerText =
      "Face Detected!!!";

    // Bounding Box Width and Height
    const noseTipX = faces[0].annotations.noseTip[0][0];

    const videoElementDiv = context.shadowRoot.getElementById("videoElementId");
    const videoEleStyle = videoElementDiv.getBoundingClientRect();

    const videoLeft = videoEleStyle.left;
    const videoRight = videoEleStyle.right;

    // console.log(videoLeft);
    // Bucket Div
    const bucketElementDiv = context.shadowRoot.getElementById("bucketDiv");
    const bucketWidth = bucketElementDiv.getBoundingClientRect().width;
    const bucketX =
      noseTipX * context.canvasSettings.canvasscalex +
      context.canvasSettings.canvasx;

    // console.log("bucketX", bucketX);

    if (bucketX >= 0 && bucketX <= videoRight - videoLeft) {
      bucketElementDiv.style.left = `${bucketX - bucketWidth / 2}px`;
    }

    // Detect Faces
    if (context.canvasSettings.showcanvas.toLowerCase() === "true") {
      canvas.getContext("2d").clearRect(0, 0, videowidth, videoheight);
      __drawMesh(faces, context);
    }

    // Falling Object Div
    if (context.fallingObjectInitiated === true) {
      context.fallingObjectInitiated = false;
      __initiateFallingObjects(context);
      context.shadowRoot.getElementById("loadingDivMain").style.display =
        "none";
    }
  }
}

function __initiateFallingObjects(context) {
  const fallObjectElement =
    context.shadowRoot.getElementById("fallingObjectDiv");

  const fallingObjectsEleStyle = fallObjectElement.getBoundingClientRect();
  const fallingObjLeft = fallingObjectsEleStyle.left;
  const fallingObjRight = fallingObjectsEleStyle.right;

  const assetsArray = __assetsFunc(context);

  assetsArray.forEach((asset, index) => {
    setTimeout(() => {
      const img = document.createElement("img");
      img.src = asset.img;
      img.setAttribute("id", `asset_${index}`);
      img.width = context.assetsSettings.assetwidth;
      img.height = context.assetsSettings.assetheight;
      img.style.position = "absolute";
      //   img.style.border = "1px solid black";
      let randomPosition =
        Math.random() * Math.abs(fallingObjRight - fallingObjLeft);
      randomPosition =
        randomPosition + Number(context.assetsSettings.assetwidth) >
        fallingObjRight
          ? fallingObjRight - Number(context.assetsSettings.assetwidth)
          : randomPosition;
      img.style.left = `${randomPosition}px`;
      fallObjectElement.appendChild(img);

      // Setting the Image in Screen
      context.catchedClothes[index] = "insideScreen";

      const bucketDiv = context.shadowRoot.getElementById("bucketDiv");
      const bucketStyles = window.getComputedStyle(bucketDiv);

      const fallingInterval = setInterval(() => {
        const imgEle = context.shadowRoot.getElementById(`asset_${index}`);
        // const imgStyling = imgEle.getBoundingClientRect();
        const imgStyling = window.getComputedStyle(imgEle);

        imgEle.style.top = `${
          Number(imgStyling.top.split("px")[0]) + 1 * asset.acceleration
        }px`;

        // Bucket Cordinates
        // (bx1, by1) (bx1 + wb, by1)
        // (bx1, by1 + wh) (bx1 + wb, by1 + wh)
        const bw = Number(bucketStyles.width.split("px")[0]);
        const bh = Number(bucketStyles.height.split("px")[0]);
        const bx1 = Number(bucketStyles.left.split("px")[0]) - fallingObjLeft;
        const by1 = Number(bucketStyles.top.split("px")[0]);
        const bx1plusbw = bx1 + bw;
        const by1plusbh = by1 + bh;

        // console.log("bx1 ", bx1);

        // Falling Object Coordiantes
        // (fx1, fy1) (fx1 + fw, fy1)
        // (fx1, fy1 + fh) (fx1 + fw, fy1 + fh)
        const fw = Number(imgStyling.width.split("px")[0]);
        const fh = Number(imgStyling.height.split("px")[0]);
        const fx1 = Number(imgStyling.left.split("px")[0]);
        const fy1 = Number(imgStyling.top.split("px")[0]);
        const fx1plustfw = fx1 + fw;
        const fy1plusfh = fy1 + fh;
        const centerX1 = fx1 + fw / 2;
        const centerY1 = fy1 + fh / 2;

        // Check Conditions
        //1. Center of the Asset should be greater than fy1
        //2. CenterX1 - fw/2 > bx1
        //3. CenterX1 + fw/2 < bx1 + bw
        //4. by1Plusbh > fy1Plusfh
        // if(centerY1 >=  by1  && centerX1 - fw/2 > bx1  && centerX1 + fw/2 < bx1plusbw  && by1plusbh > fy1plusfh){
        if (
          fx1 >= bx1 - 5 &&
          fx1plustfw <= bx1plusbw + 5 &&
          fy1plusfh > by1 + fh * 0.3
        ) {
          context.shadowRoot.getElementById("poof").style.display = "block";
          clearInterval(fallingInterval);
          context.catchedClothes[index] = "caught";

          imgEle.remove();
          setTimeout(() => {
            context.shadowRoot.getElementById("poof").style.display = "none";
          }, 100);
        }

        // if(imgStyling.top > bucketStyles.top + bucketStyles){
        if (fy1 > by1plusbh) {
          context.catchedClothes[index] = "removed";

          clearInterval(fallingInterval);
          imgEle.remove();
        }

        if (
          context.catchedClothes?.length > 0 &&
          !context.catchedClothes.includes("notInScreen") &&
          !context.catchedClothes.includes("insideScreen")
        ) {
          const caughtClothes = context.catchedClothes.filter(
            (item) => item === "caught"
          );
          context.shadowRoot.getElementById(
            "caughtMessage"
          ).innerText = `You Caught ${caughtClothes.length} clothes`;
          context.shadowRoot.getElementById(
            "caughtMessage"
          ).style.visibility = `inherit`;
        }
      }, 10);
    }, asset.startTime);
  });
}

function __drawMesh(predictions, context) {
  if (predictions.length > 0) {
    predictions.forEach((predect) => {
      const keyPoints = predect.scaledMesh;
      // const keyPoints = predect.mesh;
      for (let i = 0; i < keyPoints.length; i++) {
        const x =
          keyPoints[i][0] * context.canvasSettings.canvasscalex +
          context.canvasSettings.canvasx;
        const y =
          keyPoints[i][1] * context.canvasSettings.canvasscaley +
          context.canvasSettings.canvasy;

        context.ctx.beginPath();
        context.ctx.arc(x, y, 1, 0, 3 * Math.PI);
        context.ctx.fillStyle = "aqua";
        context.ctx.fill();
      }
      context.ctx.scale(0.8, 0.8);
    });
  }
}

class FaceDetectionCatchClothes extends HTMLElement {
  constructor() {
    super();

    // Class Variables
    this.model = null;
    this.fallingObjectInitiated = true;
    this.assetsArr = null;
    this.catchedClothes = null; // [notInScreen, insideScreen, caught, removed]
    this.isLoading = true;
    this.ctx = null;
    this.clearDetectorInterval = null;
    this.canvasSettings = CanvasConfig;
    this.assetsSettings = assetsStyling;
    // Class Variables

    this.root = this.attachShadow({ mode: "open" });
    const template = document.createElement("template");
    const mainDiv = document.createElement("div");
    mainDiv.setAttribute("id", "mainDivElement");

    const video = document.createElement("video");
    const videowidth = this.getAttribute("videowidth")
      ? this.getAttribute("videowidth")
      : "640";
    const videoheight = this.getAttribute("videoheight")
      ? this.getAttribute("videoheight")
      : "480";
    video.setAttribute("id", "videoElementId");
    video.setAttribute("autoplay", true);
    video.setAttribute("playsinline", true);
    video.setAttribute("autoplay", true);
    video.setAttribute("muted", true);
    video.setAttribute("width", videowidth);
    video.setAttribute("height", videoheight);

    // Create Canvas
    const canvasDiv = document.createElement("canvas");
    canvasDiv.setAttribute("id", "canvasDiv");
    canvasDiv.width = videowidth;
    canvasDiv.height = videoheight;

    // Bucket Div
    const bucketDiv = document.createElement("div");
    bucketDiv.setAttribute("id", "bucketDiv");

    // Poof Div
    const poofDiv = document.createElement("div");
    poofDiv.setAttribute("id", "poof");

    // Poof GIF
    const poofGif = document.createElement("img");
    poofGif.src = "./assets/poof.gif";
    poofGif.width = Number(this.assetsSettings.bucketwidth) * 0.85;
    poofGif.height = "30";
    // poofGif.style.display = "none"
    poofDiv.appendChild(poofGif);

    bucketDiv.appendChild(poofDiv);

    // Image Bucket
    const bucketImage = document.createElement("img");
    bucketImage.src = "./assets/bucket.png";
    bucketImage.width = this.assetsSettings.bucketwidth;
    bucketImage.height = this.assetsSettings.bucketheight;
    bucketDiv.appendChild(bucketImage);

    // Falling Object Div
    const fallingObjectDiv = document.createElement("div");
    fallingObjectDiv.setAttribute("id", "fallingObjectDiv");
    fallingObjectDiv.style.width = `${videowidth}px`;
    fallingObjectDiv.style.height = `${videoheight}px`;

    // const caughtMessage
    const caughtMessage = document.createElement("div");
    caughtMessage.setAttribute("id", "caughtMessage");

    // Loading Div
    const loadingDivMain = document.createElement("div");
    loadingDivMain.style.position = `absolute`;
    loadingDivMain.setAttribute("id", "loadingDivMain");

    const loadingDiv = document.createElement("div");
    loadingDiv.setAttribute("id", "loadingDiv");
    loadingDivMain.appendChild(loadingDiv);

    const loadingDivText = document.createElement("div");
    loadingDivText.setAttribute("id", "loadingDivText");
    loadingDivText.innerText = "Loading....";
    loadingDivMain.appendChild(loadingDivText);

    // Appending Child to the Main Div
    mainDiv.appendChild(video);
    mainDiv.appendChild(canvasDiv);
    mainDiv.appendChild(bucketDiv);
    mainDiv.appendChild(fallingObjectDiv);
    mainDiv.appendChild(caughtMessage);
    mainDiv.appendChild(loadingDivMain);

    const style = document.createElement("style");
    style.innerText = `${customStyling}`;
    const cloneTemplate = template.content.cloneNode(true);
    cloneTemplate.appendChild(style);
    cloneTemplate.appendChild(mainDiv);

    this.root.appendChild(cloneTemplate);
  }

  connectedCallback() {
    try {
      const video = this.shadowRoot.getElementById("videoElementId");
      const canvasDiv = this.shadowRoot.getElementById("canvasDiv");
      if (video && startVideo(video)) {
        loadModel(this, canvasDiv);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Defining the allowed attributes
  static get observedAttributes() {
    return [
      "videowidth",
      "videoheight",
      "showcanvas",
      "canvasscalex",
      "canvasscaley",
      "canvasx",
      "canvasy",
      "assetwidth",
      "assetheight",
      "bucketwidth",
      "bucketheight",
    ];
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    const video = this.shadowRoot.getElementById("videoElementId");
    if ((attrName == "videowidth" || attrName === "videoheight") && video) {
      const canvasDiv = this.shadowRoot.getElementById("canvasDiv");
      loadModel(this, canvasDiv);
    }

    if (
      attrName === "canvasscalex" ||
      attrName === "canvasscaley" ||
      attrName === "canvasx" ||
      attrName === "canvasy"
    ) {
      this.canvasSettings = {
        ...this.canvasSettings,
        [attrName]:
          (attrName === "canvasscalex" || attrName === "canvasscaley") &&
          Number(newVal) === 0
            ? 1
            : Number(newVal),
      };
    }

    if (attrName === "showcanvas") {
      this.canvasSettings = {
        ...this.canvasSettings,
        [attrName]: newVal.toLowerCase(),
      };
    }

    if (
      attrName === "assetwidth" ||
      attrName === "assetheight" ||
      attrName === "bucketwidth" ||
      attrName === "bucketheight"
    ) {
    }
  }
}

customElements.define("catch-clothes", FaceDetectionCatchClothes);
