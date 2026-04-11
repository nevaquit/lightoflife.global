<?php
/**
 * Replace Revolution Slider with a clean text-based hero section.
 */

if (!is_admin()) {

// Inject hero CSS in <head>
add_action('wp_head', function() {
    if (!is_front_page() && !is_home()) return;
    ?>
    <style id="lol-hero-css">
    /* Hide Revolution Slider on homepage */
    rs-module-wrap,
    #rev_slider_1_1_wrapper,
    .rev_slider_wrapper,
    .forcefullwidth_wrapper_tp_banner {
        display: none !important;
    }

    /* === HERO SECTION === */
    .lol-hero {
        background: linear-gradient(160deg, #FFFDF7 0%, #FBF2E0 100%);
        border-bottom: 1px solid #F0E6CC;
        padding: 5rem 2rem 4.5rem;
        text-align: center;
        position: relative;
        overflow: hidden;
    }
    .lol-hero::before {
        content: '';
        position: absolute;
        top: -60px; left: 50%; transform: translateX(-50%);
        width: 500px; height: 500px;
        background: radial-gradient(circle, rgba(180,125,26,0.07) 0%, transparent 70%);
        pointer-events: none;
    }
    .lol-hero-eyebrow {
        font-size: 11px;
        letter-spacing: 0.18em;
        color: #B47D1A;
        font-weight: 700;
        margin-bottom: 1.25rem;
        text-transform: uppercase;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .lol-hero h1 {
        font-size: 42px !important;
        font-weight: 700 !important;
        color: #1a1200 !important;
        line-height: 1.2 !important;
        margin-bottom: 1.25rem !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Georgia, serif !important;
        letter-spacing: -0.5px !important;
    }
    .lol-hero h1 em {
        font-style: normal !important;
        color: #B47D1A !important;
    }
    .lol-hero-verse {
        font-size: 15px;
        color: #777;
        line-height: 1.85;
        max-width: 520px;
        margin: 0 auto 2rem;
        font-style: italic;
        font-family: Georgia, serif;
    }
    .lol-hero-verse cite {
        font-style: normal;
        font-size: 12px;
        color: #B47D1A;
        display: block;
        margin-top: 8px;
        font-weight: 600;
        letter-spacing: 0.04em;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .lol-hero-btns {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
    }
    .lol-btn-gold {
        background: #B47D1A !important;
        color: #fff !important;
        border: none !important;
        border-radius: 6px !important;
        padding: 13px 30px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        text-decoration: none !important;
        display: inline-block !important;
        transition: background 0.15s !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
    .lol-btn-gold:hover { background: #9B6C14 !important; color: #fff !important; }
    .lol-btn-outline {
        background: transparent !important;
        color: #B47D1A !important;
        border: 1.5px solid #B47D1A !important;
        border-radius: 6px !important;
        padding: 12px 30px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        text-decoration: none !important;
        display: inline-block !important;
        transition: background 0.15s !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
    .lol-btn-outline:hover { background: #FBF2E0 !important; color: #B47D1A !important; }

    /* PILLARS */
    .lol-pillars {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border-bottom: 1px solid #F0E6CC;
        background: #fff;
    }
    .lol-pillar {
        padding: 2rem 1.75rem;
        border-right: 1px solid #F0E6CC;
        text-align: center;
    }
    .lol-pillar:last-child { border-right: none; }
    .lol-pillar-icon {
        width: 46px; height: 46px;
        border-radius: 50%;
        background: #FBF2E0;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1rem;
    }
    .lol-pillar h3 {
        font-size: 14px !important;
        font-weight: 600 !important;
        color: #1a1200 !important;
        margin-bottom: 0.4rem !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
    .lol-pillar p {
        font-size: 12px !important;
        color: #888 !important;
        line-height: 1.7 !important;
        margin: 0 !important;
    }

    @media (max-width: 768px) {
        .lol-hero h1 { font-size: 28px !important; }
        .lol-pillars { grid-template-columns: 1fr; }
        .lol-pillar { border-right: none; border-bottom: 1px solid #F0E6CC; }
        .lol-pillar:last-child { border-bottom: none; }
    }
    </style>
    <?php
}, 5);

// Build the hero HTML
function lol_hero_html() {
    if (!is_front_page() && !is_home()) return;
    ob_start();
    ?>
    <div class="lol-hero">
        <div class="lol-hero-eyebrow">One Light &middot; One Truth &middot; One Global Mission</div>
        <h1>Illuminating the world<br>with <em>eternal truth</em></h1>
        <p class="lol-hero-verse">
            &ldquo;I am the light of the world. Whoever follows me will never walk in darkness, but will have the light of life.&rdquo;
            <cite>&mdash; John 8:12 NIV</cite>
        </p>
        <div class="lol-hero-btns">
            <a href="<?php echo esc_url(home_url('/sermons/')); ?>" class="lol-btn-gold">Watch sermons</a>
            <a href="<?php echo esc_url(home_url('/podcast/')); ?>" class="lol-btn-outline">Listen to podcast</a>
            <a href="<?php echo esc_url(home_url('/contact/')); ?>" class="lol-btn-outline">Join us &rarr;</a>
        </div>
    </div>
    <div class="lol-pillars">
        <div class="lol-pillar">
            <div class="lol-pillar-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="3" width="16" height="14" rx="2" stroke="#B47D1A" stroke-width="1.4"/>
                    <line x1="5" y1="8" x2="15" y2="8" stroke="#B47D1A" stroke-width="1.3" stroke-linecap="round"/>
                    <line x1="5" y1="11.5" x2="11" y2="11.5" stroke="#B47D1A" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
            </div>
            <h3>Weekly bulletins</h3>
            <p>Announcements, prayer points, and community news every week</p>
        </div>
        <div class="lol-pillar">
            <div class="lol-pillar-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="#B47D1A" stroke-width="1.4"/>
                    <polygon points="8,6.5 15,10 8,13.5" fill="#B47D1A"/>
                </svg>
            </div>
            <h3>Sermons &amp; podcast</h3>
            <p>Stream on-demand or tune in to Light of Life with R. Jenkins</p>
        </div>
        <div class="lol-pillar">
            <div class="lol-pillar-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="#B47D1A" stroke-width="1.4"/>
                    <ellipse cx="10" cy="10" rx="3.5" ry="8" stroke="#B47D1A" stroke-width="1.2"/>
                    <line x1="2" y1="10" x2="18" y2="10" stroke="#B47D1A" stroke-width="1.2"/>
                </svg>
            </div>
            <h3>Global outreach</h3>
            <p>Ministry and causes reaching nations across every continent</p>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

// Try wp_body_open first (modern themes)
add_action('wp_body_open', function() {
    echo lol_hero_html();
}, 1);

// Fallback: inject via wp_footer + JS to move hero above content
add_action('wp_footer', function() {
    if (!is_front_page() && !is_home()) return;
    // Only run fallback if hero wasn't already output by wp_body_open
    ?>
    <script>
    (function() {
        if (document.querySelector('.lol-hero')) return; // already injected
        var heroHTML = <?php echo json_encode(lol_hero_html()); ?>;
        var temp = document.createElement('div');
        temp.innerHTML = heroHTML;
        // Find the best insertion point — after the nav/header, before main content
        var targets = [
            document.querySelector('#rev_slider_1_1_wrapper'),
            document.querySelector('rs-module-wrap'),
            document.querySelector('.rev_slider_wrapper'),
            document.querySelector('.site-content'),
            document.querySelector('#content'),
            document.querySelector('main'),
            document.querySelector('.container:not(nav .container):not(#header .container)')
        ];
        var target = targets.find(function(t) { return t; });
        if (target) {
            target.parentNode.insertBefore(temp.querySelector('.lol-hero'), target);
            target.parentNode.insertBefore(temp.querySelector('.lol-pillars'), target);
        } else {
            // Last resort: prepend to body after header
            var header = document.querySelector('#header, .navbar, header, nav');
            if (header && header.nextSibling) {
                header.parentNode.insertBefore(temp.querySelector('.lol-hero'), header.nextSibling);
                var hero = document.querySelector('.lol-hero');
                hero.parentNode.insertBefore(temp.querySelector('.lol-pillars'), hero.nextSibling);
            }
        }
    })();
    </script>
    <?php
}, 99);

} // end !is_admin()
