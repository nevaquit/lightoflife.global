<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'xgmztfmy_WPNUG' );

/** Database username */
define( 'DB_USER', 'xgmztfmy_WPNUG' );

/** Database password */
define( 'DB_PASSWORD', 'Il[Qs1uxBl&:Ws!#O' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          'w`L:c33,3I?TT}o1]f>>;bP-?E8q2uL4|F:X,[zD`< Q va>7{tV=hN<lwbMMR6O' );
define( 'SECURE_AUTH_KEY',   'LVo>m.0jWAC c}UFcK@[mW7l_r==v!M6oKlk<43xttx)^~gN#Lt mY:Fl69X$0X=' );
define( 'LOGGED_IN_KEY',     'E9vl.6ee!Gs&de/G_@&3=5l?:8&708LJ5 $~i~c;J|}@,&D%.j-Am:zZk90YdCv2' );
define( 'NONCE_KEY',         'q6de~i*^lg)Wmcm`ro3kS{!>QKKq)4~V|Q9Y@C$YBoR54eVGY5q ,(1i|3,bs,N0' );
define( 'AUTH_SALT',         '5Pc:f*Sov?OuF[~TGL2QmPV9V*[,TG,G:EaY52E`EP/J Wd|?0c!fe&`iDX8lXbA' );
define( 'SECURE_AUTH_SALT',  '){A;SaYM6+%R{R=W399V.yQFek[QYY,-Hs2  3$Jct*2e3/A:4vzVFAfvDE(wA99' );
define( 'LOGGED_IN_SALT',    ',W0$54#;j9S=fuewf|LxOm*S^~uW3W%2j(s(W{q[xHJGgHfO?{MdGQi)Qr!$?;z(' );
define( 'NONCE_SALT',        'Eq~6{~)/r>u:MF*IT{-W&%Q2Kn`]]o6yhv=/lmE<y&Fjl~r5_ERAS.WUWJtXLu6x' );
define( 'WP_CACHE_KEY_SALT', '@u|{DXVP9^41=}HHa^sM=Pp9iG}a.b<V,ZV_tI(^X|jemZneT+STluXjjoj|u_x2' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'twu_';


/* Add any custom values between this line and the "stop editing" line. */



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

define( 'WP_AUTO_UPDATE_CORE', false );
define( 'WP_DEBUG_LOG', false );
define( 'AUTOMATIC_UPDATER_DISABLED', true );
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', dirname( __FILE__ ) . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
