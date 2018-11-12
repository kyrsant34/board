# -*- coding: utf-8 -*-
from datetime import datetime, date, timedelta

from django.db.models import Count, Sum, Q

from rest_framework import generics, views
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response


class BaseView(views.APIView):
    permission_classes = (IsAdminUser,)
    pagination_class = None
    authentication_classes = (SessionAuthentication,)

    def format_date(self, dat):
        if isinstance(dat, str):
            dat = datetime.strptime(dat, "%d-%m-%Y").date()
        return dat


class WithdrawalView(BaseView, generics.ListAPIView):
    queryset = ClientWithdrawalOrder.real_qs().filter(status=ClientWithdrawalOrder.READY)


class WithdrawalByPSView(WithdrawalView):
    # serializer здесь используется только для render класса - DatatablesFilterBackend
    serializer_class = WithdrawalByPSrSerializer
    filter_backends = ()
    CUR_MAP_DICT = dict(PaymentSystemLocale.CURRENCIES)

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.values('payment_system').annotate(sum=Sum('amount_converted'), cnt=Count('id'))
        return qs

    def _get_date_filter(self, request):
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        if from_date and to_date:
            from_date = self.format_date(from_date)
            to_date = self.format_date(to_date)
            _filter = Q(Q(success_at__date__gte=from_date, success_at__date__lte=to_date) | \
                        Q(sent_to_processing_at__date__gte=from_date, sent_to_processing_at__date__lte=to_date))
        else:
            _filter = Q()
        return _filter

    def _get_deposits(self):
        deposits = ClientDepositOrder.real_qs().filter(Q(status=ClientDepositOrder.SUCCESS))
        return deposits

    def _get_withdrawals(self):
        withdrawals = ClientWithdrawalOrder.real_qs().filter(Q(status__in=(ClientWithdrawalOrder.SENT,
                                                                           ClientWithdrawalOrder.SUCCESS)))
        return withdrawals

    def _get_ps(self, request):
        ps_qs = PaymentSystem.objects.all()
        if request.query_params.get('is_active') == 'true':
            ps_qs = ps_qs.filter(is_active=True)
        used_ps = list()
        for ps in ps_qs:
            ps_idx = ps.payment_system
            if ps_idx in used_ps:
                continue
            used_ps.append(ps_idx)
            yield ps

    def _get_currencies_by_ps(self, ps):
        used_currencies = list()
        for cur_indexes in ps.locales.values_list('currency', flat=True):
            for cur_idx in cur_indexes:
                cur_idx = int(cur_idx)
                if cur_idx in used_currencies:
                    continue
                used_currencies.append(cur_idx)
                yield self.CUR_MAP_DICT[cur_idx]


class WithdrawalByCreatedDateView(WithdrawalView):
    serializer_class = WithdrawalByCreatedDaterSerializer
    filter_backends = (BoardDatatablesByCreatedDateFilterBackend,)
    MAX_SIZE = 5

    def filter_queryset(self, queryset):
        return super().filter_queryset(queryset)[:self.MAX_SIZE]


class WithdrawalReadyToProcessData(WithdrawalView):

    def get(self, request, *args, **kwargs):
        data = {
            'rtp_count': self.queryset.count(),
            'rtp_count_cny': self.queryset.filter(currency='CNY').aggregate(sum=Sum('amount_converted'))['sum'] or 0,
            'rtp_count_usd': self.queryset.filter(currency='USD').aggregate(sum=Sum('amount_converted'))['sum'] or 0,
        }
        return Response(data=data)


class MtAccountData(WithdrawalView):
    queryset = MTAccount.real_qs()
    serializer_class = WithdrawalByCreatedDaterSerializer

    def get(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.queryset)
        data = {
            'balance_count': qs.count(),
            'balance_cny': qs.filter(currency='CNY').aggregate(sum=Sum('balance'))['sum'],
            'balance_usd': qs.filter(currency='USD').aggregate(sum=Sum('balance'))['sum'],
        }
        return Response(data=data)


class ReportData(BaseView):

    def get(self, request, *args, **kwargs):
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        data = dict()
        if from_date and to_date:
            data['selected_period'] = self._get_report_by_date(from_date=self.format_date(from_date),
                                                               to_date=self.format_date(to_date))
        else:
            today = date.today()
            data['today'] = self._get_report_by_date(from_date=today, to_date=today)

            data['current_month'] = self._get_report_by_date(from_date=date(today.year, today.month, 1),
                                                             to_date=today)
        return Response(data)

    def _get_report_by_date(self, from_date, to_date):
        filter = Q((Q(success_at__date__gte=from_date, success_at__date__lte=to_date) | \
                    Q(sent_to_processing_at__date__gte=from_date, sent_to_processing_at__date__lte=to_date)) & \
                   Q(status__in=(ClientWithdrawalOrder.SUCCESS,
                                 ClientWithdrawalOrder.SENT)))
        deposits = ClientDepositOrder.objects.filter(filter)
        manual_deposits = ManualDepositOrder.objects.filter(filter)
        withdrawals = ClientWithdrawalOrder.objects.filter(filter)
        data = dict(deposits_cnt=deposits.count() + manual_deposits.count(),
                    withdrawals_cnt=withdrawals.count())
        for currency in ('CNY', 'USD'):
            currency_key = currency.lower()

            data[f'deposits_{currency_key}'] = deposits.filter(currency=currency)\
                                                       .aggregate(sum=Sum('amount'))['sum'] or 0
            data[f'deposits_{currency_key}'] += manual_deposits.filter(currency=currency)\
                                                               .aggregate(sum=Sum('amount'))['sum'] or 0
            data[f'withdrawals_{currency_key}'] = withdrawals.filter(conversion_currency=currency)\
                                                             .aggregate(sum=Sum('amount_converted'))['sum'] or 0
        pnl_data = self.calculate_pnl(from_date, to_date)
        data.update(**pnl_data)
        for key, val in data.items():
            data[key] = round(val, 2)
        return data

