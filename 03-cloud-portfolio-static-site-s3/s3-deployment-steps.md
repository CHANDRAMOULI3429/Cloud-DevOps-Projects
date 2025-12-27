# Portfolio Website - Static Site on AWS S3

A production-ready, fully static portfolio website designed to showcase software development and cloud infrastructure projects. Built with vanilla HTML, CSS, and JavaScript, optimized for hosting on AWS S3 static website hosting.

## 🏗️ Architecture

### Why Static + S3?

This portfolio is built as a **pure static website** for several strategic reasons:

1. **Cost-Effective**: AWS S3 static website hosting is extremely affordable (often under $1/month for low traffic)
2. **Scalable**: S3 automatically handles traffic spikes without any configuration
3. **Fast**: Static files serve instantly without server processing overhead
4. **Reliable**: S3 offers 99.999999999% (11 9's) durability
5. **Simple**: No server management, no database, no backend complexity
6. **SEO-Friendly**: Static HTML is perfectly crawlable by search engines
7. **Cloud-Native**: Demonstrates understanding of cloud infrastructure fundamentals

### Architecture Components

```
┌─────────────────────────────────────────┐
│         AWS CloudFront (CDN)            │  ← Optional: Global distribution
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      AWS S3 Bucket (Static Hosting)     │  ← Primary hosting
│  ┌───────────────────────────────────┐  │
│  │  index.html                        │  │
│  │  assets/                           │  │
│  │    ├── css/                        │  │
│  │    ├── js/                         │  │
│  │    ├── images/                     │  │
│  │    └── data/                       │  │
│  │        └── projects.json           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         User's Browser                  │
│  ┌───────────────────────────────────┐ │
│  │  Vanilla JavaScript loads         │ │
│  │  projects.json dynamically        │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Key Design Decisions

1. **No Build Process**: Pure static files mean no compilation, no build step, just upload and go
2. **Dynamic Content via JSON**: Projects are loaded from `projects.json`, making it easy to add new projects without touching HTML
3. **Modular CSS**: Separated into `main.css`, `components.css`, and `responsive.css` for maintainability
4. **Vanilla JavaScript**: No frameworks means faster load times and no dependency management
5. **Semantic HTML**: Proper HTML5 semantic elements for SEO and accessibility
6. **Relative Paths**: All paths are relative, ensuring it works when uploaded to S3

## 📁 Folder Structure

```
portfolio/
├── index.html                 # Main HTML file
├── README.md                  # This file
├── assets/
│   ├── css/
│   │   ├── main.css          # Base styles, variables, typography
│   │   ├── components.css    # Component-specific styles
│   │   └── responsive.css    # Media queries and responsive design
│   ├── js/
│   │   ├── main.js           # Navigation, smooth scroll, general functionality
│   │   └── projects.js       # Dynamic project loading and modal
│   ├── images/               # Image assets (favicon, project images, etc.)
│   └── data/
│       └── projects.json     # Project data (JSON format)
```

## 🚀 Adding a New Project

Adding a new project is simple and requires **zero HTML changes**. Just edit `assets/data/projects.json`.

### Step 1: Open `assets/data/projects.json`

### Step 2: Add a new project object

```json
{
  "id": 2,
  "title": "Your Project Name",
  "problem": "Describe the problem this project solves. Be specific and professional.",
  "architecture": "Explain the architecture, design decisions, and how the system works. This is important for demonstrating cloud knowledge.",
  "techStack": [
    "Technology 1",
    "Technology 2",
    "Technology 3"
  ],
  "cloudServices": [
    "AWS Service 1",
    "AWS Service 2"
  ],
  "keyLearnings": [
    "Learning point 1",
    "Learning point 2",
    "Learning point 3"
  ],
  "githubLink": "https://github.com/yourusername/project-repo",
  "liveDemoLink": "https://your-demo-url.com",
  "status": "Completed",
  "featured": false
}
```

### Step 3: Save the file

The website will automatically:
- Display the new project in the projects grid
- Create a clickable project card
- Show full details in a modal when clicked
- Sort featured projects first

### Project Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique identifier (use incrementing numbers) |
| `title` | string | Yes | Project title |
| `problem` | string | Yes | Problem statement (shown in modal) |
| `architecture` | string | Yes | Architecture overview (shown in modal) |
| `techStack` | array | No | Array of technology names |
| `cloudServices` | array | No | Array of AWS/cloud services used |
| `keyLearnings` | array | No | Array of learning points |
| `githubLink` | string | No | GitHub repository URL |
| `liveDemoLink` | string | No | Live demo URL |
| `status` | string | Yes | "Completed" or "In Progress" |
| `featured` | boolean | No | If true, appears first in grid |

## 📦 Deployment to AWS S3

### Prerequisites

- AWS Account
- AWS CLI installed and configured
- S3 bucket created (or create one during deployment)

### Step 1: Create S3 Bucket

```bash
aws s3 mb s3://your-portfolio-bucket-name --region us-east-1
```

**Note**: Choose a globally unique bucket name. Bucket names must be DNS-compliant.

### Step 2: Configure Bucket for Static Website Hosting

```bash
# Enable static website hosting
aws s3 website s3://your-portfolio-bucket-name \
  --index-document index.html \
  --error-document index.html
```

### Step 3: Set Bucket Policy (Public Read Access)

Create a file `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-portfolio-bucket-name/*"
    }
  ]
}
```

Apply the policy:

```bash
aws s3api put-bucket-policy \
  --bucket your-portfolio-bucket-name \
  --policy file://bucket-policy.json
```

### Step 4: Upload Files

```bash
# Upload all files to S3
aws s3 sync . s3://your-portfolio-bucket-name \
  --exclude "*.git/*" \
  --exclude "README.md" \
  --exclude "bucket-policy.json" \
  --exclude ".gitignore"
```

### Step 5: Access Your Website

Your website will be available at:

```
http://your-portfolio-bucket-name.s3-website-us-east-1.amazonaws.com
```

Or if you configured a different region:

```
http://your-portfolio-bucket-name.s3-website-<region>.amazonaws.com
```

### Optional: Custom Domain with CloudFront

For a custom domain and better performance:

1. **Create CloudFront Distribution**:
   - Origin: Your S3 bucket website endpoint
   - Default root object: `index.html`
   - Enable HTTPS

2. **Configure Route 53** (if you own a domain):
   - Create an A record pointing to your CloudFront distribution

3. **Update S3 Bucket Policy** (if using CloudFront):
   - Restrict access to CloudFront only for better security

## 🔧 Local Development

### Option 1: Simple HTTP Server (Python)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Option 2: Node.js http-server

```bash
npx http-server -p 8000
```

### Option 3: VS Code Live Server

Install the "Live Server" extension in VS Code and click "Go Live".

Then visit: `http://localhost:8000`

## 🎨 Customization

### Updating Personal Information

1. **Hero Section**: Edit `index.html` - update name, role, and mission statement
2. **About Section**: Edit the `<section id="about">` in `index.html`
3. **Skills**: Edit the skills grid in `index.html`
4. **Contact**: Update contact links in the contact section
5. **Social Links**: Update GitHub and LinkedIn URLs in hero CTA buttons

### Styling

- **Colors**: Edit CSS variables in `assets/css/main.css` (`:root` selector)
- **Typography**: Modify font variables in `assets/css/main.css`
- **Spacing**: Adjust spacing variables in `assets/css/main.css`
- **Components**: Edit `assets/css/components.css` for component-specific styles
- **Responsive**: Modify `assets/css/responsive.css` for breakpoints

### Theme

The site uses CSS variables, making it easy to create a dark theme. Simply add a theme toggle in JavaScript and swap variable values.

## 📝 Best Practices Implemented

- ✅ Semantic HTML5
- ✅ Mobile-first responsive design
- ✅ SEO-friendly meta tags
- ✅ Accessibility considerations (ARIA labels, keyboard navigation)
- ✅ Performance optimized (no external dependencies, minimal CSS/JS)
- ✅ Clean, maintainable code structure
- ✅ XSS protection (HTML escaping in JavaScript)
- ✅ Relative paths for S3 compatibility
- ✅ Professional error handling

## 🔒 Security Considerations

- All user-generated content (project data) is escaped to prevent XSS
- Bucket policy should be reviewed for production (consider CloudFront-only access)
- HTTPS recommended (use CloudFront with SSL certificate)

## 📈 Future Enhancements

Potential additions (all still static):

- Dark/light theme toggle
- Project filtering by technology
- Blog section (static markdown files)
- Analytics integration (Google Analytics, Plausible)
- Contact form (using third-party service like Formspree)
- RSS feed generation

## 🐛 Troubleshooting

### Projects not loading?

1. Check browser console for errors
2. Verify `projects.json` is valid JSON (use a JSON validator)
3. Ensure file path is correct: `assets/data/projects.json`
4. Check CORS if testing locally (some browsers block local file access)

### S3 website not accessible?

1. Verify bucket policy allows public read access
2. Check that static website hosting is enabled
3. Ensure `index.html` is in the root of the bucket
4. Verify bucket name in URL matches exactly

### Styling issues?

1. Clear browser cache
2. Verify all CSS files are uploaded to S3
3. Check file paths are relative (not absolute)

## 📄 License

This portfolio template is open source. Feel free to use it for your own portfolio.

## 👤 Author

Built as a demonstration of cloud infrastructure knowledge and modern frontend development practices.

---

**Note**: This portfolio itself is Project 1 - a static website hosted on AWS S3, demonstrating the very architecture it describes.

