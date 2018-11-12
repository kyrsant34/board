# -*- coding: utf-8 -*-
from django.urls import path

from .views import (index, WithdrawalByPSView, WithdrawalByCreatedDateView, WithdrawalReadyToProcessData,
                    MtAccountData, ReportData)


urls = [
        path('', index, name='index'),
        path('withdrawals-by-ps/', WithdrawalByPSView.as_view()),
        path('withdrawals-by-date/', WithdrawalByCreatedDateView.as_view()),
        path('withdrawal-ready-to-process/', WithdrawalReadyToProcessData.as_view()),
        path('mt-account-data/', MtAccountData.as_view()),
        path('report-data/', ReportData.as_view()),
]
