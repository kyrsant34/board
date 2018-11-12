# -*- coding: utf-8 -*-
import os
import raven


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SENTRY_PROJECT_ENV = os.getenv('SENTRY_PROJECT_ENV', 'DEVELOPMENT')
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')

DASHBOARD_SENTRY_DSN = os.getenv('DASHBOARD_SENTRY_DSN',
                                 'https://xcbcvbcbc5:423542'
                                 '83d6534535331@sentry.io/1534')
RAVEN_CONFIG = {
    'dsn': DASHBOARD_SENTRY_DSN,
    'release': raven.fetch_git_sha(os.path.abspath(BASE_DIR)),
    'tags': dict(PROJECT_ENV=SENTRY_PROJECT_ENV)
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'root': {
        'level': 'ERROR',
        'handlers': ['sentry'],
    },
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s '
                      '%(process)d %(thread)d %(message)s'
        },
    },
    'handlers': {
        'sentry': {
            'level': 'ERROR',
            'class': 'raven.contrib.django.raven_compat.handlers.SentryHandler',
            'tags': {
                'redis': REDIS_HOST,
            },
        },
        'console': {
            'level': 'ERROR',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        }
    },
    'loggers': {
        'django.db.backends': {
            'level': 'ERROR',
            'handlers': ['console'],
            'propagate': False,
        },
        'raven': {
            'level': 'ERROR',
            'handlers': ['console'],
            'propagate': False,
        },
        'sentry.errors': {
            'level': 'DEBUG',
            'handlers': ['console'],
            'propagate': False,
        },
    },
}
