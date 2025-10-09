const fs = require('fs');
const path = require('path');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// List of required assets
const assets = [
  'logo-white.png',
  'google-icon.png',
  'facebook-icon.png',
  'apple-icon.png',
  'email-sent.png'
];

// Create placeholder images
assets.forEach(asset => {
  const filePath = path.join(assetsDir, asset);
  if (!fs.existsSync(filePath)) {
    // Create a simple text-based SVG as a placeholder
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial" font-size="16" text-anchor="middle" dominant-baseline="middle">
          ${asset.replace('.png', '')}
        </text>
      </svg>
    `;
    fs.writeFileSync(filePath, svg.trim());
    console.log(`Created placeholder: ${filePath}`);
  } else {
    console.log(`File already exists: ${filePath}`);
  }
});

console.log('Placeholder assets created successfully!');
