const imginput = document.querySelector('input');
const canvas = document.getElementById('kansas');
if (!imginput) console.error('file input not found: use <input type="file">');
if (!canvas) console.error('canvas#kansas not found');

const ctx = canvas.getContext('2d');
if (!ctx) console.error('No CTX???');

async function loadImage(e) {
    const isFile = e && e.target && e.target.files && e.target.files[0];
    
    if (!isFile) {
        alert('Somehow no file loaded?');
        return;
    }
    
    const file = e.target.files[0];
    console.log('selected file:', file);

    if (!file.type || !file.type.startsWith('image') || file.type.includes('jp')) {
        alert('Only supports images (duh)');
        return;
    }

    const img = new Image();
    imgurl = URL.createObjectURL(file);
    
    img.onload = async () => {
        try { await img.decode(); } catch (err) { console.warn('img.decode() warning', err); }

        if (img.width > 64 || img.height > 64) {
            alert('Image too big.');
            return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.fillStyle = 'black';
        ctx.imageSmoothingEnabled = false;
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
        
        document.querySelector('img').src = imgurl;
    };

    img.onerror = (err) => {
        alert('Image failed to load/parse');
        console.error('img.onerror for', file, err);
    };
    img.src = imgurl;
    
}