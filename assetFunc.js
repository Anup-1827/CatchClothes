function __assetsFunc(context){
    const assets = [

            {
              "img": "./assets/1.png",
              "startTime": 100,
              "acceleration": 0.5,
            },
            {
              "img": "./assets/2.png",
              "startTime": 1100,
              "acceleration": 1,
            },
            {
              "img": "./assets/3.png",
              "startTime": 2100,
              "acceleration": 2,
            },
            {
              "img": "./assets/4.png",
              "startTime": 3100,
              "acceleration": 0.5,
            },
            {
              "img": "./assets/5.png",
              "startTime": 4100,
              "acceleration": 5,
            },
            {
              "img": "./assets/6.png",
              "startTime": 5100,
              "acceleration": 0.5,
            },
            {
              "img": "./assets/7.png",
              "startTime": 6100,
              "acceleration": 0.5,
            },
            {
              "img": "./assets/8.png",
              "startTime": 7100,
              "acceleration": 0.5,
            },{
              "img": "./assets/9.png",
              "startTime": 8100,
              "acceleration": 0.5,
            },{
              "img": "./assets/10.png",
              "startTime": 9100,
              "acceleration": 0.5,
            },{
              "img": "./assets/11.png",
              "startTime":10100,
              "acceleration": 0.5,
            }
          ];
    
          context.catchedClothes = new Array(assets.length).fill("notInScreen")
          return assets
} 
