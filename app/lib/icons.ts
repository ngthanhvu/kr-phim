import {
  faArrowLeft,
  faArrowUp,
  faArrowTurnDown,
  faArrowTrendUp,
  faArrowsRotate,
  faBackward,
  faBackwardFast,
  faBars,
  faBolt,
  faBug,
  faCalendarDays,
  faCamera,
  faChartColumn,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircle,
  faCircleCheck,
  faCircleInfo,
  faCirclePlay,
  faCircleQuestion,
  faClock,
  faClockRotateLeft,
  faClosedCaptioning,
  faComment,
  faCommentDots,
  faEnvelope,
  faExpand,
  faEye,
  faEyeSlash,
  faFilm,
  faFloppyDisk,
  faFastForward,
  faForward,
  faForwardStep,
  faGear,
  faGlobe,
  faHeart,
  faHome,
  faImage,
  faKey,
  faLanguage,
  faLayerGroup,
  faLock,
  faMagnifyingGlass,
  faMars,
  faMinus,
  faMusic,
  faPause,
  faPen,
  faPlay,
  faPlus,
  faRectangleList,
  faRightFromBracket,
  faRightToBracket,
  faServer,
  faShare,
  faShareNodes,
  faShield,
  faSpinner,
  faStar,
  faThumbtack,
  faThumbsDown,
  faThumbsUp,
  faToggleOff,
  faToggleOn,
  faTrashCan,
  faTriangleExclamation,
  faTv,
  faUser,
  faUserCircle,
  faUsers,
  faVenus,
  faVideo,
  faVolumeHigh,
  faVolumeXmark,
  faXmark,
  faPaperPlane,
  faCrown,
  faListOl,
  faFont,
  faTrash,
  faCommentSlash,
  faRotate,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons'

import { library } from '@fortawesome/fontawesome-svg-core'

library.add(
  faArrowLeft,
  faArrowUp,
  faArrowTurnDown,
  faArrowTrendUp,
  faArrowsRotate,
  faBackward,
  faBackwardFast,
  faBars,
  faBolt,
  faBug,
  faCalendarDays,
  faCamera,
  faChartColumn,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircle,
  faCircleCheck,
  faCircleInfo,
  faCirclePlay,
  faCircleQuestion,
  faClock,
  faClockRotateLeft,
  faClosedCaptioning,
  faComment,
  faCommentDots,
  faEnvelope,
  faExpand,
  faEye,
  faEyeSlash,
  faFilm,
  faFloppyDisk,
  faFastForward,
  faForward,
  faForwardStep,
  faGear,
  faGlobe,
  faHeart,
  faHome,
  faImage,
  faKey,
  faLanguage,
  faLayerGroup,
  faLock,
  faMagnifyingGlass,
  faMars,
  faMinus,
  faMusic,
  faPause,
  faPen,
  faPlay,
  faPlus,
  faRectangleList,
  faRightFromBracket,
  faRightToBracket,
  faServer,
  faShare,
  faShareNodes,
  faShield,
  faSpinner,
  faStar,
  faThumbtack,
  faThumbsDown,
  faThumbsUp,
  faToggleOff,
  faToggleOn,
  faTrashCan,
  faTriangleExclamation,
  faTv,
  faUser,
  faUserCircle,
  faUsers,
  faVenus,
  faVideo,
  faVolumeHigh,
  faVolumeXmark,
  faXmark,
  faPaperPlane,
  faCrown,
  faListOl,
  faFont,
  faTrash,
  faCommentSlash,
  faRotate,
  faPenToSquare,
)

export type IconName =
  | 'alert-triangle'
  | 'arrow-left'
  | 'arrow-up'
  | 'badge-check'
  | 'bar-chart'
  | 'bug'
  | 'calendar-days'
  | 'camera'
  | 'captions'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'circle'
  | 'circle-help'
  | 'circle-play'
  | 'clock'
  | 'corner-down-left'
  | 'crown'
  | 'edit'
  | 'eye'
  | 'eye-off'
  | 'fast-forward'
  | 'film'
  | 'globe'
  | 'heart'
  | 'history'
  | 'home'
  | 'image'
  | 'info'
  | 'key'
  | 'languages'
  | 'layers'
  | 'loader'
  | 'lock'
  | 'log-in'
  | 'log-out'
  | 'mail'
  | 'mars'
  | 'maximize'
  | 'menu'
  | 'message-circle'
  | 'message-square'
  | 'minus'
  | 'music'
  | 'pause'
  | 'pencil'
  | 'picture-in-picture'
  | 'pin'
  | 'play'
  | 'plus'
  | 'refresh'
  | 'rewind'
  | 'save'
  | 'search'
  | 'send'
  | 'server'
  | 'settings'
  | 'share'
  | 'shield'
  | 'skip-forward'
  | 'star'
  | 'thumbs-down'
  | 'thumbs-up'
  | 'toggle-left'
  | 'toggle-right'
  | 'trash'
  | 'trending-up'
  | 'tv'
  | 'type'
  | 'user'
  | 'user-round'
  | 'users'
  | 'venus'
  | 'video'
  | 'volume'
  | 'volume-x'
  | 'x'
  | 'zap'

const iconMap: Record<IconName, [string, string]> = {
  'alert-triangle': ['fas', 'triangle-exclamation'],
  'arrow-left': ['fas', 'arrow-left'],
  'arrow-up': ['fas', 'arrow-up'],
  'badge-check': ['fas', 'circle-check'],
  'bar-chart': ['fas', 'chart-column'],
  'bug': ['fas', 'bug'],
  'calendar-days': ['fas', 'calendar-days'],
  'camera': ['fas', 'camera'],
  'captions': ['fas', 'closed-captioning'],
  'check': ['fas', 'check'],
  'chevron-down': ['fas', 'chevron-down'],
  'chevron-left': ['fas', 'chevron-left'],
  'chevron-right': ['fas', 'chevron-right'],
  'chevron-up': ['fas', 'chevron-up'],
  'circle': ['fas', 'circle'],
  'circle-help': ['fas', 'circle-question'],
  'circle-play': ['fas', 'circle-play'],
  'clock': ['fas', 'clock'],
  'corner-down-left': ['fas', 'arrow-turn-down'],
  'crown': ['fas', 'crown'],
  'edit': ['fas', 'pen-to-square'],
  'eye': ['fas', 'eye'],
  'eye-off': ['fas', 'eye-slash'],
  'fast-forward': ['fas', 'forward-fast'],
  'film': ['fas', 'film'],
  'globe': ['fas', 'globe'],
  'heart': ['fas', 'heart'],
  'history': ['fas', 'clock-rotate-left'],
  'home': ['fas', 'home'],
  'image': ['fas', 'image'],
  'info': ['fas', 'circle-info'],
  'key': ['fas', 'key'],
  'languages': ['fas', 'language'],
  'layers': ['fas', 'layer-group'],
  'loader': ['fas', 'spinner'],
  'lock': ['fas', 'lock'],
  'log-in': ['fas', 'right-to-bracket'],
  'log-out': ['fas', 'right-from-bracket'],
  'mail': ['fas', 'envelope'],
  'mars': ['fas', 'mars'],
  'maximize': ['fas', 'expand'],
  'menu': ['fas', 'bars'],
  'message-circle': ['fas', 'comment-dots'],
  'message-square': ['fas', 'comment'],
  'minus': ['fas', 'minus'],
  'music': ['fas', 'music'],
  'pause': ['fas', 'pause'],
  'pencil': ['fas', 'pen'],
  'picture-in-picture': ['fas', 'rectangle-list'],
  'pin': ['fas', 'thumbtack'],
  'play': ['fas', 'play'],
  'plus': ['fas', 'plus'],
  'refresh': ['fas', 'arrows-rotate'],
  'rewind': ['fas', 'backward-fast'],
  'save': ['fas', 'floppy-disk'],
  'search': ['fas', 'magnifying-glass'],
  'send': ['fas', 'paper-plane'],
  'server': ['fas', 'server'],
  'settings': ['fas', 'gear'],
  'share': ['fas', 'share-nodes'],
  'shield': ['fas', 'shield'],
  'skip-forward': ['fas', 'forward-step'],
  'star': ['fas', 'star'],
  'thumbs-down': ['fas', 'thumbs-down'],
  'thumbs-up': ['fas', 'thumbs-up'],
  'toggle-left': ['fas', 'toggle-off'],
  'toggle-right': ['fas', 'toggle-on'],
  'trash': ['fas', 'trash-can'],
  'trending-up': ['fas', 'arrow-trend-up'],
  'tv': ['fas', 'tv'],
  'type': ['fas', 'font'],
  'user': ['fas', 'user'],
  'user-round': ['fas', 'user-circle'],
  'users': ['fas', 'users'],
  'venus': ['fas', 'venus'],
  'video': ['fas', 'video'],
  'volume': ['fas', 'volume-high'],
  'volume-x': ['fas', 'volume-xmark'],
  'x': ['fas', 'xmark'],
  'zap': ['fas', 'bolt'],
}

export function getIcon(name: IconName) {
  return iconMap[name]
}
