# Stasis configuration for czep.net

### local directory setup
DIR_PUBLISH   = "_pub"
DIR_POSTS     = "posts"
DIR_PAGES     = "pages"
DIR_DRAFTS    = "drafts"
DIR_STATIC    = "static"
DIR_TEMPLATES = "templates"
POST_STORE    = "post_store.db"

### public-facing site metadata
SITE = {
    'title':        "Variables and Observations",
    'description':  "work, data, and working_with_data",
    'site_name':    "czep.net",
    'author':       ("czep", "/about/"),
    'author_name':  "Scott Czepiel",
    'absolute_url': "https://czep.net",
    'base_url':     "",
    'bluesky':      "@czep.net",
    'github':       "https://github.com/czep",
    'links': [
        ("Home", "/"),
        ("About", "/about/"),
        ("Ancient History", "/degauss.html"),
        ("RSS Feed", "/feed.xml")
    ],
    'recent_posts': 10,
    'maincss':      "/css/main_rev.css",
    'rssfeed':      "feed.xml"
}

PANDOC_ARGS = "markdown+backtick_code_blocks+inline_code_attributes+tex_math_dollars"
EXCERPT_SEPARATOR = "<!--excerpt-->"
TOPICS_URL_PREFACE = "topics"

### pagination
POSTS_PER_PAGE = 10

### development server
SERVER_PORT = 9988

### deployment
AWS_PROFILE = "blogwriter"
S3_BUCKET = "czep.net"
S3_USE_GZIP = True
S3_GZIP_COMPRESSION = 9
S3_GZIP_FILES = [
    "*.html",
    "*.css",
    "*.js",
    "*.txt"
]
S3_GZIP_MINSIZE = 1024

### files matching these patterns will never be deleted from S3
IGNORE_ON_SERVER = [
    "audio*",
    "blog*",
    "contact*",
    "contact.html",
    "data*",
    "degauss.html",
    "edu*",
    "html_skool*",
    "img*",
    "main.css",
    "quicksilver*",
    "retard*",
    "site*",
    "stat*",
    "static*",
    "studio*",
    "visual*",
    "weblog*",
    "*.mp3",
    "*.mov",
    # "feed.xml",
]

### files matching these patterns will bever be uploaded to S3
EXCLUDE_FROM_UPLOAD = [
    "*.DS_Store",
    "*.upload"
]

### url format for posts: "/YYYY/MM/DD/slug.html"
# def MAKE_POST_URL(args):
#     # return "/{}/{}.html".format(self.input_path.stem[2:4], self.input_path.stem[11:])
#     url = "/{}/{}/{}/{}.html".format(
#         args['meta']['date'].strftime("%Y"),
#         args['meta']['date'].strftime("%m"),
#         args['meta']['date'].strftime("%d"),
#         args['meta']['input_path'].stem[11:]
#     )
#     return url

### "/YY/slug.html"
def FN_POST_URL(args):
    # return "/{}/{}.html".format(self.input_path.stem[2:4], self.input_path.stem[11:])
    url = "/{}/{}.html".format(
        args['meta']['date'].strftime("%y"),
        args['input_path'].stem[11:]
    )
    return url

