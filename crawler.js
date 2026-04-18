const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const baseSources = [
    {
        name: '本科生院',
        url: 'https://uc.whu.edu.cn/xkjs.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://uc.whu.edu.cn/'
    },
    {
        name: '计算机学院',
        url: 'https://cs.whu.edu.cn/xwdt/tzgg.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://cs.whu.edu.cn/xwdt/'
    },
    {
        name: '电子信息学院',
        url: 'http://eis.whu.edu.cn/index/newList_zw?newskind_id=20160924095648892vb0A090GE7DHe',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'http://eis.whu.edu.cn/index/'
    },
    {
        name: '经管学院',
        url: 'https://ems.whu.edu.cn/rcpy/bkjx/tzgg.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://ems.whu.edu.cn/rcpy/bkjx/'
    },
    {
        name: '物理学院',
        url: 'https://physics.whu.edu.cn/rcpy/bksjy.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://physics.whu.edu.cn/rcpy/'
    },
    {
        name: '遥感学院',
        url: 'https://rsgis.whu.edu.cn/rcpy/bksjy.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://rsgis.whu.edu.cn/rcpy/'
    },
    {
        name: '生科学院',
        url: 'https://bio.whu.edu.cn/rcpy/bksjy.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://bio.whu.edu.cn/rcpy/'
    },
    {
        name: '外语学院',
        url: 'https://fls.whu.edu.cn/rcpy/bksjy.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://fls.whu.edu.cn/rcpy/'
    },
    {
        name: '法学院',
        url: 'https://law.whu.edu.cn/xwdt/tzgg.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://law.whu.edu.cn/xwdt/'
    },
    {
        name: '文学院',
        url: 'https://zw.whu.edu.cn/rcpy/bksjy/tzgg.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://zw.whu.edu.cn/rcpy/bksjy/'
    },
    {
        name: '弘毅学堂',
        url: 'https://hyxt.whu.edu.cn/xwdt/tzgg.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://hyxt.whu.edu.cn/xwdt/'
    },
    {
        name: '化学学院',
        url: 'https://chem.whu.edu.cn/rcpy/bksjy/tzgg.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://chem.whu.edu.cn/rcpy/bksjy/'
    },
    {
        name: '水利水电学院',
        url: 'https://slsd.whu.edu.cn/rcpy/bksjy.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://slsd.whu.edu.cn/rcpy/'
    },
    {
        name: '测绘学院',
        url: 'https://main.sgg.whu.edu.cn/rcpy/bksjy.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://main.sgg.whu.edu.cn/rcpy/'
    },
    {
        name: '动力与机械学院',
        url: 'https://pmc.whu.edu.cn/',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://pmc.whu.edu.cn/'
    },
    {
        name: '电气与自动化学院',
        url: 'https://eea.whu.edu.cn/',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://eea.whu.edu.cn/rcpy/'
    },
    {
        name: '土木建筑工程学院',
        url: 'https://civ.whu.edu.cn/rcpy/bksjy.htm',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://civ.whu.edu.cn/rcpy/'
    },
    {
        name: '资源与环境科学学院',
        url: 'https://sres.whu.edu.cn/',
        kind: 'competition',
        selector: 'li',
        linkPrefix: 'https://sres.whu.edu.cn/rcpy/'
    },
    {
        name: '武汉大学官网',
        url: 'https://www.whu.edu.cn/',
        kind: 'activity',
        selector: 'a',
        linkPrefix: 'https://www.whu.edu.cn/'
    },
    {
        name: '武汉大学新闻网',
        url: 'https://news.whu.edu.cn/',
        kind: 'activity',
        selector: 'a',
        linkPrefix: 'https://news.whu.edu.cn/'
    }
];

function safeOrigin(urlString) {
    try {
        const u = new URL(urlString);
        return `${u.protocol}//${u.host}/`;
    } catch (_) {
        return '';
    }
}

const additionalCollegeHomes = [
    { name: '信息管理学院', home: 'https://sim.whu.edu.cn/' },
    { name: '经济与管理学院', home: 'https://ems.whu.edu.cn/' },
    { name: '新闻与传播学院', home: 'https://sjic.whu.edu.cn/' },
    { name: '历史学院', home: 'https://history.whu.edu.cn/' },
    { name: '哲学学院', home: 'https://phil.whu.edu.cn/' },
    { name: '政治与公共管理学院', home: 'https://pspa.whu.edu.cn/' },
    { name: '马克思主义学院', home: 'https://mks.whu.edu.cn/' },
    { name: '数学与统计学院', home: 'https://math.whu.edu.cn/' },
    { name: '地球与空间科学学院', home: 'https://ess.whu.edu.cn/' },
    { name: '测绘学院(主站)', home: 'https://main.sgg.whu.edu.cn/' },
    { name: '资源与环境科学学院(主站)', home: 'https://sres.whu.edu.cn/' },
    { name: '水利水电学院(主站)', home: 'https://slsd.whu.edu.cn/' },
    { name: '土木建筑工程学院(主站)', home: 'https://civ.whu.edu.cn/' },
    { name: '动力与机械学院(主站)', home: 'https://pmc.whu.edu.cn/' },
    { name: '电气与自动化学院(主站)', home: 'https://eea.whu.edu.cn/' },
    { name: '法学院(主站)', home: 'https://law.whu.edu.cn/' },
    { name: '外国语言文学学院(主站)', home: 'https://fls.whu.edu.cn/' },
    { name: '文学院(主站)', home: 'https://zw.whu.edu.cn/' },
    { name: '化学与分子科学学院(主站)', home: 'https://chem.whu.edu.cn/' },
    { name: '生命科学学院(主站)', home: 'https://bio.whu.edu.cn/' },
    { name: '物理科学与技术学院(主站)', home: 'https://physics.whu.edu.cn/' },
    { name: '电子信息学院(主站)', home: 'http://eis.whu.edu.cn/' },
    { name: '计算机学院(主站)', home: 'https://cs.whu.edu.cn/' },
    { name: '遥感信息工程学院(主站)', home: 'https://rsgis.whu.edu.cn/' }
];

function buildCollegeSources(college) {
    const origin = safeOrigin(college.home) || college.home;
    return [
        {
            name: college.name,
            url: origin,
            kind: 'competition',
            selector: 'li',
            linkPrefix: origin
        },
        {
            name: college.name,
            url: origin,
            kind: 'activity',
            selector: 'a',
            linkPrefix: origin
        }
    ];
}

const derivedActivitySources = baseSources
    .filter(s => s.kind === 'competition')
    .map(s => {
        const origin = safeOrigin(s.url) || s.url;
        return {
            name: s.name,
            url: origin,
            kind: 'activity',
            selector: 'a',
            linkPrefix: origin
        };
    });

const additionalSources = additionalCollegeHomes.flatMap(buildCollegeSources);

const sources = [
    ...baseSources,
    ...derivedActivitySources,
    ...additionalSources
];

function normalizeDate(dateStr) {
    if (!dateStr) return '';
    const m = dateStr.match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
    if (!m) return '';
    return `${m[1]}-${m[2]}-${m[3]}`;
}

function cleanTitle(raw) {
    if (!raw) return '';
    let t = String(raw).replace(/\s+/g, ' ').trim();
    t = t.replace(/^\d{1,2}\s*(\d{4})[.\-/](\d{2})\b/, '$1-$2');
    t = t.replace(/^\d{1,2}\s*\d{4}[.\-/]\d{2}\s*/, '');
    t = t.replace(/^\d{4}[.\-/]\d{2}\b\s*/, '');
    t = t.replace(/^\d{4}-\d{2}\b\s*/, '');
    t = t.replace(/^\d{4}[.\-/]\d{2}[.\-/]\d{2}\s*/, '');
    t = t.replace(/^\d{1,2}[.\-/]\d{1,2}\s*/, '');
    t = t.replace(/\s+\d{1,2}[.\-/]\d{1,2}$/, '');
    t = t.replace(/\s+\d{1,2}\/\d{1,2}$/, '');
    return t.trim();
}

function discoverCandidateListPages(html, baseUrl) {
    const $ = cheerio.load(html);
    const candidates = new Set();
    $('a').each((_, a) => {
        const href = $(a).attr('href');
        if (!href || href.includes('javascript:')) return;
        const text = ($(a).text() || '').trim();
        const hit = /通知|公告|人才培养|本科|教务|竞赛|学生|培养|活动|讲座|论坛|报告|预告|校园|文化|rcpy|bksjy|tzgg/i.test(text)
            || /(rcpy|bksjy|tzgg|tzgg\.htm|bksjy\.htm|xyhd|xshd|hd|event|list|more)/i.test(href);
        if (!hit) return;
        try {
            const abs = new URL(href, baseUrl).href;
            if (abs.startsWith('http')) candidates.add(abs);
        } catch (_) { }
    });
    return Array.from(candidates);
}

function extractFromHtml(html, pageUrl, source, selector) {
    const $ = cheerio.load(html);
    const results = [];

    const sel = selector || 'li';
    $(sel).each((index, element) => {
        const kind = source && source.kind ? source.kind : 'competition';
        if (kind === 'activity' && index > 6000) return false;
        const a = $(element).is('a') ? $(element) : $(element).find('a').first();
        if (!a || a.length === 0) return;

        let title = a.attr('title') || a.text().trim();
        if (!title || title.length < 6) {
            title = ($(element).text() || '').trim();
        }
        const href = a.attr('href');
        if (!href || href.includes('javascript')) return;
        title = cleanTitle(title);
        if (!title || title.length < 6) return;
        if (title.includes('点击查看') || title.includes('更多') || title.includes('MORE')) return;

        const dateRegex = /\d{4}[.\-/]\d{2}[.\-/]\d{2}/;
        let date = '';

        const spanText = $(element).find('span').text().trim();
        const spanDateMatch = spanText.match(dateRegex);
        if (spanDateMatch) {
            date = normalizeDate(spanDateMatch[0]);
        }

        const titleDateMatch = title.match(dateRegex);
        if (titleDateMatch) {
            if (!date) date = normalizeDate(titleDateMatch[0]);
            title = title.replace(dateRegex, '').trim();
        }

        if (!date) {
            const liDateMatch = $(element).text().match(dateRegex);
            if (liDateMatch) date = normalizeDate(liDateMatch[0]);
        }

        const includeKeywords = kind === 'activity'
            ? ['活动', '讲座', '论坛', '报告', '演讲', '沙龙', '工作坊', '展览', '音乐会', '晚会', '演出', '观影', '比赛', '志愿', '招募', '社团', '开放日', '运动会', '体育', '文体', '读书', '讲坛']
            : ['竞赛', '大赛', '挑战赛', '选拔赛', '校赛', '邀请赛', '联赛', '杯', '设计赛', '技能赛', '创新大赛', '创业大赛', '报名通知'];
        const excludeKeywords = kind === 'activity'
            ? ['奖学金', '推免', '夏令营', '研究生招生', '硕士招生', '博士招生', '调剂', '考试', '招聘', '就业', '放假', '缴费', '公示', '名单', '先进集体', '优秀个人', '团内评优']
            : ['奖学金', '推免', '夏令营', '研究生招生', '硕士招生', '博士招生', '调剂', '考试', '讲座', '会议', '招聘', '就业', '放假', '缴费', '公示', '名单', '先进集体', '优秀个人', '团内评优'];

        const hasInclude = includeKeywords.some(k => title.includes(k));
        const hasExclude = excludeKeywords.some(k => title.includes(k));

        if (hasInclude && !hasExclude) {
            let link = href;
            try {
                link = new URL(href, pageUrl).href;
            } catch (_) { }
            if (kind === 'activity') {
                const isDetail = /show\.jsp/i.test(link)
                    || /\/info\/\d+/i.test(link)
                    || /\/\d{4}\/\d+/i.test(link)
                    || /\/\d+\.s?html?$/i.test(link)
                    || /\/\d+\.htm$/i.test(link);
                if (!isDetail) return;
            }

            let category = '综合';
            const lowerTitle = title.toLowerCase();
            if (kind === 'activity') {
                if (lowerTitle.includes('讲座') || lowerTitle.includes('报告') || lowerTitle.includes('演讲') || lowerTitle.includes('论坛') || lowerTitle.includes('讲坛')) category = '活动/学术';
                else if (lowerTitle.includes('音乐会') || lowerTitle.includes('晚会') || lowerTitle.includes('演出') || lowerTitle.includes('展览') || lowerTitle.includes('观影') || lowerTitle.includes('电影')) category = '活动/文体';
                else if (lowerTitle.includes('志愿') || lowerTitle.includes('招募') || lowerTitle.includes('社团') || lowerTitle.includes('报名')) category = '活动/社团';
                else category = '活动/综合';
            } else {
                if (lowerTitle.includes('计算机') || lowerTitle.includes('程序') || lowerTitle.includes('算法') || lowerTitle.includes('ict') || lowerTitle.includes('代码')) category = 'IT/计算机';
                else if (lowerTitle.includes('英语') || lowerTitle.includes('外语') || lowerTitle.includes('演讲') || lowerTitle.includes('翻译')) category = '语言/人文';
                else if (lowerTitle.includes('建模') || lowerTitle.includes('数学') || lowerTitle.includes('物理') || lowerTitle.includes('化学')) category = '数理/基础';
                else if (lowerTitle.includes('创新') || lowerTitle.includes('创业') || lowerTitle.includes('商业') || lowerTitle.includes('挑战赛') || lowerTitle.includes('案例')) category = '双创/经管';
                else if (lowerTitle.includes('设计') || lowerTitle.includes('艺术') || lowerTitle.includes('建筑') || lowerTitle.includes('工业')) category = '设计/艺术';
                else if (lowerTitle.includes('电子') || lowerTitle.includes('通信') || lowerTitle.includes('智能')) category = '电子/信息';
            }

            results.push({
                title,
                link,
                date: date || '近期',
                category,
                type: kind,
                source: source.name,
                crawlTime: new Date().toISOString()
            });
        }
    });

    return results;
}

async function fetchFromSource(source) {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        const candidates = Array.isArray(source.urls) && source.urls.length ? source.urls : [source.url];

        for (const candidateUrl of candidates) {
            try {
                const response = await axios.get(candidateUrl, {
                    headers,
                    timeout: 15000,
                    validateStatus: () => true
                });

                if (response.status >= 400) continue;
                const results = extractFromHtml(response.data, candidateUrl, source, source.selector);
                if (results.length > 0) return results;
            } catch (_) { }
        }

        let origin = '';
        try {
            origin = new URL(source.url).origin;
        } catch (_) { }

        if (origin) {
            try {
                const home = await axios.get(origin, { headers, timeout: 15000, validateStatus: () => true });
                if (home.status < 400) {
                    const discovered = discoverCandidateListPages(home.data, origin);
                    const maxTry = Math.min(discovered.length, 8);
                    for (let i = 0; i < maxTry; i += 1) {
                        const candidateUrl = discovered[i];
                        const response = await axios.get(candidateUrl, { headers, timeout: 15000, validateStatus: () => true });
                        if (response.status >= 400) continue;
                        const results = extractFromHtml(response.data, candidateUrl, source, source.selector);
                        if (results.length > 0) return results;
                    }
                }
            } catch (_) { }
        }

        return [];
    } catch (error) {
        console.error(`抓取源 ${source.name} 失败: ${error.message}`);
        return [];
    }
}

async function runCrawler() {
    console.log(`[${new Date().toLocaleString()}] 开始执行全校范围抓取任务...`);
    let allItems = [];
    const sourceStatsMap = {};

    const concurrency = 5;
    let cursor = 0;

    async function worker() {
        while (cursor < sources.length) {
            const idx = cursor;
            cursor += 1;
            const source = sources[idx];
            console.log(`正在抓取: ${source.name}...`);
            const sourceData = await fetchFromSource(source);
            allItems.push(...sourceData);

            const key = source.name;
            if (!sourceStatsMap[key]) {
                sourceStatsMap[key] = {
                    source: source.name,
                    competition: 0,
                    activity: 0,
                    total: 0
                };
            }
            const kind = source.kind === 'activity' ? 'activity' : 'competition';
            sourceStatsMap[key][kind] += sourceData.length;
            sourceStatsMap[key].total += sourceData.length;

            console.log(`${source.name} 抓取到 ${sourceData.length} 条相关信息`);
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, () => worker()));

    const seen = new Set();
    const uniqueItems = allItems.filter(item => {
        const duplicate = seen.has(item.link);
        seen.add(item.link);
        return !duplicate;
    });

    uniqueItems.sort((a, b) => b.date.localeCompare(a.date));

    const sourceStats = Object.values(sourceStatsMap)
        .sort((a, b) => b.total - a.total);

    const output = {
        lastUpdate: new Date().toLocaleString(),
        count: uniqueItems.length,
        sourceStats,
        data: uniqueItems
    };

    fs.writeFileSync('competitions.json', JSON.stringify(output, null, 2));
    console.log(`抓取完成！共汇总 ${uniqueItems.length} 条信息（竞赛+校园活动），已保存。`);
}

if (require.main === module) {
    runCrawler();
}

module.exports = { runCrawler };
