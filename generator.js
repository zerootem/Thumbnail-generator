(function() {

const toolWrapper = document.getElementById('thumbnail-generator-tool');
if (!toolWrapper) return; // توقف إذا لم يتم العثور على الغلاف

const canvas = toolWrapper.querySelector('#thumbCanvas');
if (!canvas) {
    console.error("Canvas element not found within the tool wrapper.");
    return;
}
const ctx = canvas.getContext('2d',{alpha:true});

// العناصر الأساسية - البحث داخل نطاق الأداة فقط
const query = (selector) => toolWrapper.querySelector(selector);
const queryAll = (selector) => toolWrapper.querySelectorAll(selector);


// ----------------------------------------------------
// متغيرات عناصر التحكم
// ----------------------------------------------------
const bgFile = query('#bgFile');
const bgColor = query('#bgColor');
const bgColorPreview = query('#bgColorPreview');
const titleInput = query('#title');
const descInput = query('#description');
const orgInput = query('#organization');
const dateInput = query('#publishDate');
const logoFile = query('#logoFile');
const ratioSelect = query('#ratio');
const alignment = query('#alignment');
const accent = query('#accent');
const accentPreview = query('#accentPreview');
const titleSize = query('#titleSize');
const descSize = query('#descSize');

// 🆕 عناصر التنزيل الجديدة
const showDownloadOptionsBtn = query('#showDownloadOptionsBtn');
const downloadOptions = query('#downloadOptions');
const downloadPNG = query('#downloadPNG');
const downloadJPEG = query('#downloadJPEG');
const downloadWEBP = query('#downloadWEBP');


const resetBtn = query('#resetBtn');
const previewSizeText = query('#previewSizeText');
const previewFrame = query('#previewFrame');

// عناصر التاجات
const tagInput = query('#tagInput');
const addTagBtn = query('#addTagBtn');
const tagsList = query('#tagsList');

// عناصر تحريك النصوص
const titleUp = query('#titleUp');
const titleDown = query('#titleDown');
const descUp = query('#descUp');
const descDown = query('#descDown');
const orgUp = query('#orgUp');
const orgDown = query('#orgDown');

// عناصر التحكم الداخلية
const titleYInput = query('#titleY');
const titleSpacingInput = query('#titleSpacing');
const descYInput = query('#descY');
const descSpacingInput = query('#descSpacing');
const orgYInput = query('#orgY');
const logoSpacingInput = query('#logoSpacing');
const tagsYInput = query('#tagsY');
const separatorSpacingInput = query('#separatorSpacing');

// عناصر الألوان الجديدة
const titleColor = query('#titleColor');
const descColor = query('#descColor');
const tagTextColor = query('#tagTextColor');
const orgColor = query('#orgColor');

// عناصر العلامة المائية وصورة المنتج
const watermarkFile = query('#watermarkFile');
const wmX = query('#wmX');
const wmY = query('#wmY');
const wmScale = query('#wmScale');
let watermarkImage = null;

const productFile = query('#productFile');
const prodX = query('#prodX');
const prodY = query('#prodY');
const prodScale = query('#prodScale');
let productImage = null;


/* ---------- متغيرات الحالة ---------- */
let bgImage = null;
let logoImage = null;
let scale = 1; // 🆕 تم إبقاء مقياس المعاينة (scale)
let baseWidth = 1280;

// إعدادات المواضع والمسافات الافتراضية
const defaultSettings = {
  positions: {
    organization: 80,
    tags: 190,
    title: 290,
    description: 400
  },
  spacing: {
    logo: 15,
    separator: 60,
    title: 25,
    description: 20
  }
};
let settings = JSON.parse(JSON.stringify(defaultSettings));

// مصفوفة التاجات الافتراضية
let tags = ['بلوجر', 'ادوات'];

// ----------------------------------------------------

/* ---------- دوال مساعدة لاستخلاص متغيرات CSS ---------- */
function getCssVariable(name) {
    // 🆕 البحث داخل الـ wrapper لضمان العزل
    const computedStyle = getComputedStyle(toolWrapper);
    let value = computedStyle.getPropertyValue(name).trim();
    
    // إذا كان الناتج لا يزال فارغًا، استخدم القيمة من الجذر الافتراضية
    if (!value) {
        value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    return value;
}

/* ---------- تحديث معاينات الألوان ---------- */
function updateColorPreviews() {
  bgColorPreview.style.background = bgColor.value;
  accentPreview.style.background = accent.value;
  
  // تحديث لون السمة في CSS (الذي يمثل الآن --linkC)
  toolWrapper.style.setProperty('--linkC', accent.value); 
}

/* ---------- تهيئة التاجات ---------- */
function initializeTags() {
  updateTagsDisplay();
}

// 🆕 تحديث دالة عرض التاجات لاستخدام أيقونة SVG
function updateTagsDisplay() {
  tagsList.innerHTML = '';
  const removeIcon = `<svg class='line' viewBox='0 0 24 24'><path d='M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z'></path><path d='M9.16998 14.83L14.83 9.17004'></path><path d='M14.83 14.83L9.16998 9.17004'></path></svg>`;

  tags.forEach((tag, index) => {
    const tagElement = document.createElement('div');
    tagElement.className = 'tag';
    tagElement.innerHTML = `
      ${tag}
      <button class="remove-tag" type="button" onclick="window.removeTagFromGenerator(${index})">${removeIcon}</button>
    `;
    tagsList.appendChild(tagElement);
  });
}

// لضمان عمل الدالة عند النقر من داخل الأداة (توضع في النطاق العالمي window)
window.removeTagFromGenerator = (index) => {
  tags.splice(index, 1);
  updateTagsDisplay();
  renderCanvas();
};

function addTag() {
  const tagText = tagInput.value.trim();
  if (tagText && !tags.includes(tagText)) {
    tags.push(tagText);
    tagInput.value = '';
    updateTagsDisplay();
    renderCanvas();
  }
}

/* ---------- أحداث التاجات ---------- */
addTagBtn.addEventListener('click', addTag);
tagInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTag();
});

/* ---------- أحداث الألوان والتحكم ---------- */
[bgColor, accent, titleColor, descColor, tagTextColor, orgColor].forEach(i => i.addEventListener('input', () => {
  updateColorPreviews();
  renderCanvas();
}));

// تحديث القيم من المدخلات اليدوية
[titleYInput, titleSpacingInput, descYInput, descSpacingInput, 
 orgYInput, logoSpacingInput, tagsYInput, separatorSpacingInput,
 wmX, wmY, wmScale, prodX, prodY, prodScale, alignment, dateInput
].forEach(input => {
  input.addEventListener('input', () => {
    // تحديث قيم settings يدويًا
    if (input.id.includes('Y')) {
      const key = input.id.replace('Y', '').replace('Input', '');
      if (key === 'title') settings.positions.title = parseInt(input.value);
      if (key === 'desc') settings.positions.description = parseInt(input.value);
      if (key === 'org') settings.positions.organization = parseInt(input.value);
      if (key === 'tags') settings.positions.tags = parseInt(input.value);
    } else if (input.id.includes('Spacing')) {
      const key = input.id.replace('Spacing', '').replace('Input', '');
      if (key === 'title') settings.spacing.title = parseInt(input.value);
      if (key === 'desc') settings.spacing.description = parseInt(input.value);
      if (key === 'logo') settings.spacing.logo = parseInt(input.value);
      if (key === 'separator') settings.spacing.separator = parseInt(input.value);
    }
    renderCanvas();
  });
});


/* ---------- أحداث تحريك العناصر (التي تستخدم الأيقونات الآن) ---------- */
// تحريك العنوان
titleUp.addEventListener('click', () => {
  settings.positions.title = Math.max(50, settings.positions.title - 10);
  titleYInput.value = settings.positions.title;
  renderCanvas();
});

titleDown.addEventListener('click', () => {
  settings.positions.title = Math.min(500, settings.positions.title + 10);
  titleYInput.value = settings.positions.title;
  renderCanvas();
});

// تحريك الوصف
descUp.addEventListener('click', () => {
  settings.positions.description = Math.max(100, settings.positions.description - 10);
  descYInput.value = settings.positions.description;
  renderCanvas();
});

descDown.addEventListener('click', () => {
  settings.positions.description = Math.min(600, settings.positions.description + 10);
  descYInput.value = settings.positions.description;
  renderCanvas();
});

// تحريك الناشر والفئات
orgUp.addEventListener('click', () => {
  settings.positions.organization = Math.max(20, settings.positions.organization - 10);
  settings.positions.tags = Math.max(80, settings.positions.tags - 10);
  orgYInput.value = settings.positions.organization;
  tagsYInput.value = settings.positions.tags;
  renderCanvas();
});

orgDown.addEventListener('click', () => {
  settings.positions.organization = Math.min(200, settings.positions.organization + 10);
  settings.positions.tags = Math.min(300, settings.positions.tags + 10);
  orgYInput.value = settings.positions.organization;
  tagsYInput.value = settings.positions.tags;
  renderCanvas();
});

/* ---------- دوال مساعدة لتحميل الصور ---------- */
function loadImageFromFile(file){
  return new Promise((res,rej)=>{
    if(!file){res(null);return;}
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>{URL.revokeObjectURL(url);res(img)};
    img.onerror = e=>rej(e);
    img.src = url;
  })
}

// دالة لرسم صورة دائرية (كما هي)
function drawCircularImage(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
  
  // إضافة حدود دائرية
  ctx.beginPath();
  ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
  ctx.strokeStyle = getCssVariable('--linkC') || '#ffffff';
  ctx.lineWidth = 0.50;
  ctx.stroke();
}

/* ------ استجابة لادخال الصور (الخلفية، اللوغو، العلامة، المنتج) ------ */
queryAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const image = await loadImageFromFile(file);
            if (e.target.id === 'bgFile') bgImage = image;
            else if (e.target.id === 'logoFile') logoImage = image;
            else if (e.target.id === 'watermarkFile') watermarkImage = image;
            else if (e.target.id === 'productFile') productImage = image;
            
            renderCanvas();
        } catch (err) {
            console.error(`خطأ في تحميل الملف (${e.target.id}):`, err);
            alert('خطأ في تحميل الصورة. تأكد من أن الملف صورة صالحة.');
        }
    });
});


/* ------ تحديثات الادخال النصية والحجم ------ */
const inputs = [titleInput, descInput, orgInput, ratioSelect, alignment, titleSize, descSize, dateInput];
inputs.forEach(i=>i.addEventListener('input', ()=> renderCanvas()));

/* ------ ضبط الحجم حسب النسبة ------ */
ratioSelect.addEventListener('change', ()=>{
  const r = parseFloat(ratioSelect.value) || (16/9);
  baseWidth = 1280;
  canvas.width = baseWidth;
  canvas.height = Math.round(baseWidth / r);
  previewSizeText.textContent = canvas.width + ' : ' + canvas.height;
  renderCanvas();
});


/* زر إعادة التعيين */
resetBtn.addEventListener('click', ()=>{
  // إعادة تعيين متغيرات الصور
  bgImage = null; 
  logoImage = null;
  watermarkImage = null; 
  productImage = null; 
  
  // إعادة تعيين مدخلات الملفات
  queryAll('input[type="file"]').forEach(i => i.value = ''); 

  // تحديث قيم الألوان الافتراضية
  bgColor.value = '#f8fafc';
  accent.value = '#0ea5a4';
  titleColor.value = '#0f172a'; 
  descColor.value = '#667085'; 
  tagTextColor.value = '#0ea5a4'; 
  orgColor.value = '#0f172a'; 

  // إعادة تعيين النصوص والحجم
  titleInput.value = 'عنوان المثال الكبير';
  descInput.value = 'هذا وصف تجريبي للمقالة.';
  orgInput.value = 'Modweeb';
  dateInput.value = getDefaultDate(); // تاريخ اليوم
  ratioSelect.value = '1.7777777777777777';
  alignment.value = 'right';
  titleSize.value = '48';
  descSize.value = '24';
  baseWidth = 1280;
  canvas.width = baseWidth; 
  canvas.height = 720;
  previewSizeText.textContent = canvas.width + ' : ' + canvas.height;
  
  // إعادة تعيين الإعدادات إلى الافتراضي
  settings = JSON.parse(JSON.stringify(defaultSettings));
  
  // تحديث مدخلات المواقع والمسافات
  titleYInput.value = settings.positions.title;
  titleSpacingInput.value = settings.spacing.title;
  descYInput.value = settings.positions.description;
  descSpacingInput.value = settings.spacing.description;
  orgYInput.value = settings.positions.organization;
  logoSpacingInput.value = settings.spacing.logo;
  tagsYInput.value = settings.positions.tags;
  separatorSpacingInput.value = settings.spacing.separator;

  // إعادة تعيين مدخلات الصور الإضافية
  wmX.value = '50';
  wmY.value = '50';
  wmScale.value = '10';
  prodX.value = '950';
  prodY.value = '450';
  prodScale.value = '30';
  
  // إعادة تعيين التاجات
  tags = ['بلوجر', 'ادوات'];
  updateTagsDisplay();
  
  updateColorPreviews();
  renderCanvas();
  updatePreviewStyle();
});

/* ---------- دوال التنزيل (تم الإصلاح) ---------- */

// 🆕 وظيفة لإصدار التنزيل (تم التعديل)
function initiateDownload(format = 'png', quality = 0.9) {
    // إغلاق القائمة المنبثقة
    downloadOptions.classList.remove('active');
    
    let mimeType = `image/${format}`;
    let extension = format;
    
    // 1. توليد اسم ملف فريد باستخدام الطابع الزمني
    const timestamp = Date.now();
    const fileName = `thumbnail-${timestamp}.${extension}`;

    // 2. استخدام toDataURL لتحويل الكانفاس إلى بيانات URL
    const dataURL = canvas.toDataURL(mimeType, quality);
    
    // 3. إنشاء رابط التنزيل
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = fileName; // 🆕 استخدام اسم الملف الفريد
    
    // 4. محاكاة النقر لتشغيل التنزيل
    // لا نحتاج لاستخدام URL.revokeObjectURL(dataURL) هنا لأننا نستخدم data URL
    // ونشغل التنزيل مباشرة عبر رابط a.
    document.body.appendChild(a);
    a.click();
    
    // 5. إزالة الرابط لتجنب تراكم العناصر
    a.remove();
}

// 🆕 أحداث أزرار التنزيل
showDownloadOptionsBtn.addEventListener('click', () => {
    downloadOptions.classList.toggle('active');
});

// 🆕 إغلاق القائمة المنبثقة عند النقر خارجها
document.addEventListener('click', (e) => {
    if (!toolWrapper.contains(e.target) && downloadOptions.classList.contains('active')) {
        downloadOptions.classList.remove('active');
    } else if (downloadOptions.contains(e.target)) {
        // إذا تم النقر داخل القائمة المنبثقة، قم بالتنزيل ثم الإغلاق
        const button = e.target.closest('button');
        if (button && button.dataset.format) {
            // جودة 0.9 للـ JPEG و WebP جيدة، PNG لا تحتاج لجودة (فقدان أقل)
            const quality = (button.dataset.format === 'png') ? 1.0 : 0.9; 
            initiateDownload(button.dataset.format, quality);
        }
    }
});


/* ---------- الرسم الرئيسي على الكانفاس ---------- */
async function renderCanvas(){
  // إعدادات الأساس
  const r = parseFloat(ratioSelect.value) || (16/9);
  canvas.width = baseWidth;
  canvas.height = Math.round(baseWidth / r);

  // مسح الكانفاس
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // الخلفية
  const accentColor = accent.value || getCssVariable('--linkC'); 
  const padding = Math.round(canvas.width * 0.05);
  const align = alignment.value || 'left';
  const FONT_FAMILY = 'Cairo, sans-serif';

  // 1. رسم الخلفية (صورة أو لون)
  if(bgImage){
    // ... كود رسم الخلفية (كما هو) ...
    const img = bgImage;
    const sw = img.width, sh = img.height;
    const dw = canvas.width, dh = canvas.height;
    const scaleFactor = Math.max(dw/sw, dh/sh);
    const iw = sw * scaleFactor, ih = sh * scaleFactor;
    const sx = (dw - iw) / 2, sy = (dh - ih) / 2;
    ctx.drawImage(img, sx, sy, iw, ih);
    
    // طبقة شفافة فوق الصورة بنفس لون الخلفية المختار
    ctx.fillStyle = hexToRgba(bgColor.value, 0.1);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    // إذا لم توجد صورة، نستخدم اللون المختار بعد تفتيحه (Tint) بنسبة 0.92
    const lightenedBgColor = getLightenedHex(bgColor.value || getCssVariable('--bodyB'), 0.92); 
    ctx.fillStyle = lightenedBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. رسم العلامة المائية (Watermark)
  if (watermarkImage) {
    ctx.save();
    const wmS = (parseInt(wmScale.value, 10) || 10) / 100;
    const wmAsp = watermarkImage.width / watermarkImage.height;
    const wmW = canvas.width * wmS;
    const wmH = wmW / wmAsp;
    
    const wmXPos = parseInt(wmX.value, 10) || 50;
    const wmYPos = parseInt(wmY.value, 10) || 50;

    ctx.globalAlpha = 0.5; // شفافية
    ctx.drawImage(watermarkImage, wmXPos, wmYPos, wmW, wmH);
    ctx.restore();
  }

  // 3. رسم اللوغو بشكل دائري
  if(logoImage){
    const logoSize = Math.round(canvas.width * 0.06);
    const lx = (align === 'right') ? canvas.width - padding - logoSize : padding;
    const ly = settings.positions.organization;
    
    drawCircularImage(ctx, logoImage, lx, ly, logoSize);
  }

  // 4. رسم اسم الناشر والتاريخ
  ctx.fillStyle = orgColor.value || getCssVariable('--headC'); 
  ctx.font = `600 30px ${FONT_FAMILY}`;
  ctx.textAlign = align === 'right' ? 'right' : (align === 'center' ? 'center' : 'left');
  
  const orgText = orgInput.value || '';
  const dateText = dateInput.value ? new Date(dateInput.value).toLocaleDateString('en-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const logoSize = Math.round(canvas.width * 0.06);
  
  let orgX, orgY;
  
  if (logoImage) {
      if (align === 'right') {
          orgX = canvas.width - padding - logoSize - settings.spacing.logo;
      } else if (align === 'left') {
          orgX = padding + logoSize + settings.spacing.logo;
      } else { // center
          orgX = canvas.width / 2;
      }
      orgY = settings.positions.organization + (logoSize / 2) + 8;
  } else {
      orgX = align === 'right' ? canvas.width - padding : 
             align === 'center' ? canvas.width / 2 : padding;
      orgY = settings.positions.organization + 25; 
  }

  ctx.fillText(orgText, orgX, orgY - 19);
  
  ctx.font = `400 20px ${FONT_FAMILY}`;
  ctx.fillStyle = descColor.value || getCssVariable('--bodyC'); 
  ctx.fillText(dateText, orgX, orgY + 13);

  // 5. رسم فاصل أسفل الشعار واسم الناشر
  const separatorY = settings.positions.organization + logoSize + settings.spacing.separator+ 20;
  ctx.beginPath();
  ctx.moveTo(padding, separatorY);
  ctx.lineTo(canvas.width - padding, separatorY);
  ctx.strokeStyle = hexToRgba(getCssVariable| '#e2e8f0', 0.1); 
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // 6. رسم فاصل رأسي على اليمين (إضافة جديدة)
const verticalSeparatorPadding = 30; // المسافة التي يبتعدها الخط عن حافة الكانفاس اليمنى
const verticalSeparatorX = canvas.width - verticalSeparatorPadding; // موقع X للخط الرأسي (قيمة ثابتة)

const verticalSeparatorYStart = settings.positions.organization + 15; // ابدأ بعد معلومات الناشر
const verticalSeparatorYEnd = canvas.height - padding; // انتهِ قبل الهامش السفلي
const separatorColor = orgColor.value || getCssVariable('--headC'); // لون الخط 

ctx.beginPath();
ctx.moveTo(verticalSeparatorX, verticalSeparatorYStart);
ctx.lineTo(verticalSeparatorX, verticalSeparatorYEnd);
ctx.strokeStyle = hexToRgba(separatorColor, 0.2); // لون فاتح مع شفافية 0.2
ctx.lineWidth = 1; 
ctx.stroke();


  // 6. رسم التاجات أسفل الفاصل
  if(tags.length > 0){
    const tagX = align === 'right' ? canvas.width - padding : 
                 align === 'center' ? canvas.width / 2 : padding;
    
    ctx.textAlign = align === 'right' ? 'right' : (align === 'center' ? 'center' : 'left');
    
    let currentX = tagX;
    const tagSpacing = 15;
    const tagY = settings.positions.tags;
    
    // تم إزالة متغيرات التفتيح لعدم الحاجة للخلفية
    // const TAG_LIGHTENING_MIX = 0.85; 
    // const lightenedTagColor = getLightenedHex(accentColor, TAG_LIGHTENING_MIX);
    const tagTextColorValue = tagTextColor.value || getCssVariable('--linkC'); 

    tags.forEach(tag => {
      // *** تم تغيير الملء (Fill) إلى حدود (Stroke) ***
      // ctx.fillStyle = lightenedTagColor; // تم إزالة هذه السطر

      ctx.font = `600 20px ${FONT_FAMILY}`;
      const tagWidth = ctx.measureText(tag).width + 40;
      
      ctx.beginPath();
      // تحديد إحداثيات المستطيل المدور
      const rectX = align === 'right' ? currentX - tagWidth : currentX;
      const rectY = tagY - 20;
      const rectW = tagWidth;
      const rectH = 40;
      const rectR = 20; // نصف القطر
      
      ctx.roundRect(rectX, rectY, rectW, rectH, rectR);
      
      // رسم الحدود (Stroke)
      ctx.strokeStyle = tagTextColorValue;  // استخدام لون نص التاجات للحدود
      ctx.lineWidth = 0.50; // عرض الحد
      ctx.stroke(); // تطبيق رسم الحد
      // ctx.fill(); // تم إزالة هذا السطر (لإزالة الخلفية)

      // رسم النص
      ctx.fillStyle = tagTextColorValue; 
      ctx.font = `500 20px ${FONT_FAMILY}`;
      const textX = align === 'right' ? currentX - tagWidth/2 : currentX + tagWidth/2;
      ctx.textAlign = 'center';
      ctx.fillText(tag, textX, tagY + 4);
      
      if(align === 'right') {
        currentX -= tagWidth + tagSpacing;
        ctx.textAlign = 'right';
      } else {
        currentX += tagWidth + tagSpacing;
        ctx.textAlign = 'left';
      }
    });
  }

  // 7. رسم العنوان
  const title = titleInput.value || '';
  const titleSz = parseInt(titleSize.value, 10) || 48;
  const titleX = align === 'right' ? canvas.width - padding : 
                align === 'center' ? canvas.width / 2 : padding;
  const titleEndX = align === 'right' ? padding : canvas.width - padding;

  ctx.fillStyle = titleColor.value || getCssVariable('--headC'); 
  ctx.font = `700 ${titleSz}px ${FONT_FAMILY}`;
  ctx.textAlign = align === 'right' ? 'right' : (align === 'center' ? 'center' : 'left');
  
  const maxTitleWidth = Math.abs(titleEndX - titleX);
  wrapTextFullWidth(ctx, title, titleX, settings.positions.title, maxTitleWidth, titleSz, 'bold', 1.3, titleColor.value, FONT_FAMILY);

  // 8. رسم الوصف
  const desc = descInput.value || '';
  const descSz = parseInt(descSize.value, 10) || 24;
  const descX = align === 'right' ? canvas.width - padding : 
                align === 'center' ? canvas.width / 2 : padding;
  const descEndX = align === 'right' ? padding : canvas.width - padding;

  ctx.fillStyle = descColor.value || getCssVariable('--bodyC'); 
  ctx.font = `400 ${descSz}px ${FONT_FAMILY}`;
  const maxDescWidth = Math.abs(descEndX - descX);
  wrapTextFullWidth(ctx, desc, descX, settings.positions.description, maxDescWidth, descSz, 'normal', 1.2, descColor.value, FONT_FAMILY);

  // 9. رسم صورة المنتج/العينة
  if (productImage) {
    ctx.save();
    const prodS = (parseInt(prodScale.value, 10) || 30) / 100;
    const aspectRatio = productImage.width / productImage.height;
    let prodW = canvas.width * prodS * 0.7; 
    let prodH = prodW / aspectRatio; 
    
    let prodXPos = parseInt(prodX.value, 10) || 950;
    let prodYPos = parseInt(prodY.value, 10) || 450;
    
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 8;

    ctx.drawImage(productImage, prodXPos, prodYPos, prodW, prodH); 
    
    ctx.restore(); 
  }

  // 10. رسم الزاوية الأيقونية
  const arcSize = 170;
  const isRightCorner = align === 'left' || align === 'center'; 
  
  const CORNER_LIGHTENING_MIX = 0.80; 
  const lightenedAccent = getLightenedHex(accentColor, CORNER_LIGHTENING_MIX);
  ctx.fillStyle = lightenedAccent; 
  
  ctx.beginPath();
  
  if (isRightCorner) { 
      const x = canvas.width - arcSize; 
      const y = canvas.height - arcSize; 
      ctx.moveTo(canvas.width, canvas.height); 
      ctx.lineTo(x, canvas.height); 
      ctx.arcTo(x, y, canvas.width, y, arcSize); 
      ctx.lineTo(canvas.width, y); 
  } else { 
      const x = arcSize; 
      const y = canvas.height - arcSize; 
      ctx.moveTo(0, canvas.height); 
      ctx.lineTo(x, canvas.height); 
      ctx.arcTo(x, y, 0, y, arcSize); 
      ctx.lineTo(0, y); 
  }

  ctx.closePath();
  ctx.fill();
}

/* ---------- دالة للنصوص الممتدة بالكامل (كما هي) ---------- */
function wrapTextFullWidth(context, text, x, y, maxWidth, fontSize = 24, weight = 'normal', lineHeightFactor = 1.2, color = '#000', fontFamily='Cairo, sans-serif') {
  if (!text || text.trim() === '') return;
  
  context.fillStyle = color;
  context.font = `${weight === 'bold' ? '700' : '400'} ${fontSize}px ${fontFamily}`;
  
  const lines = measureWrappedLines(context, text, maxWidth, fontSize, weight, fontFamily);
  
  for(let i = 0; i < lines.length; i++) {
    const currentY = y + (i * fontSize * lineHeightFactor);
    context.fillText(lines[i], x, currentY);
  }
}

function measureWrappedLines(context, text, maxWidth, fontSize = 24, weight = '400', fontFamily='Cairo, sans-serif') {
  if (!text || text.trim() === '') return [];
  
  context.font = `${weight} ${fontSize}px ${fontFamily}`;
  const words = text.split(' ');
  let line = '';
  let lines = [];
  
  for(let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  
  if (line.trim() !== '') {
    lines.push(line.trim());
  }
  
  return lines;
}

// دالة مساعدة للزوايا المدورة (كما هي)
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
}

// دالة تحويل Hex إلى RGBA (كما هي)
function hexToRgba(hex, alpha=1){
  if(!hex) return `rgba(0,0,0,${alpha})`;
  hex = hex.replace('#','');
  if(hex.length===3) hex = hex.split('').map(h=>h+h).join('');
  const r = parseInt(hex.substring(0,2),16);
  const g = parseInt(hex.substring(2,4),16);
  const b = parseInt(hex.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// دالة تفتيح اللون السداسي (كما هي)
function getLightenedHex(hex, mix = 0.85) {
    if (!hex || hex.length < 4) return '#ffffff';
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(h => h + h).join('');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const white = 255;
    const r_new = Math.round(r * (1 - mix) + white * mix);
    const g_new = Math.round(g * (1 - mix) + white * mix);
    const b_new = Math.round(b * (1 - mix) + white * mix);

    return '#' + [r_new, g_new, b_new].map(x => {
        const h = x.toString(16);
        return h.length === 1 ? '0' + h : h;
    }).join('');
}


/* ---------- التهيئة الأولية (Initialization) ---------- */

// وظيفة لإعادة تاريخ اليوم الافتراضي
function getDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

dateInput.value = getDefaultDate();

canvas.width = baseWidth;
canvas.height = Math.round(baseWidth / (16/9));
previewSizeText.textContent = canvas.width + ' : ' + canvas.height;
initializeTags();
updateColorPreviews();
renderCanvas();
updatePreviewStyle(); // لتطبيق scale=1 في البداية

// 🆕 وظيفة لتحديث نمط المعاينة (أبقيت عليها تحسبًا لرغبتك في إضافة التكبير/التصغير لاحقًا)
function updatePreviewStyle(){
  previewFrame.style.transform = `scale(${scale})`;
  previewFrame.style.transformOrigin = 'top center';
}

})();
