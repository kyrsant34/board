# -*- coding: utf-8 -*-
from celery import shared_task

from apps.core import logger
from apps.info.models import SystemBalanceReport


@shared_task
def save_system_balance():
    logger.info('...................CALCULATING SYSTEM BALANCE REPORT....................')
    SystemBalanceReport.create_report()
