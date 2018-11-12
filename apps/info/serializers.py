# -*- coding: utf-8 -*-
from datetime import datetime

from rest_framework import serializers

from apps.billing.models import ClientWithdrawalOrder


class WithdrawalSerializer(serializers.ModelSerializer):

    class Meta:
        model = ClientWithdrawalOrder


class WithdrawalByPSrSerializer(WithdrawalSerializer):
    cnt = serializers.IntegerField()
    sum = serializers.DecimalField(decimal_places=2, max_digits=None)

    class Meta(WithdrawalSerializer.Meta):
        fields = ('payment_system', 'cnt', 'sum', 'amount_out')
        datatables_always_serialize = ('balance', 'ps_title', 'in_out', 'amount_in', 'amount_out',
                                       'currency')


class WithdrawalByCreatedDaterSerializer(WithdrawalSerializer):
    waiting_hours = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%d-%m-%y %H:%M:%S')
    id = serializers.SerializerMethodField()
    client = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        self.now = datetime.now()
        super().__init__(*args, **kwargs)

    class Meta(WithdrawalSerializer.Meta):
        fields = ('payment_system', 'created_at', 'id', 'waiting_hours', 'client')

    def get_waiting_hours(self, obj):
        diff = self.now - obj.created_at.replace(tzinfo=None)
        return diff.days * 24 + diff.seconds // 3600

    def get_id(self, obj):
        return self._make_link(obj, str(obj.id)[:8])

    def get_client(self, obj):
        client = obj.client
        if client and hasattr(client, 'account'):
            ref_name = client.account.email or client.account.pk
            return self._make_link(obj, ref_name)

    def _make_link(self, obj, name):
        url = obj.get_crm_link()
        return f'<a href="{url}" target="_blank">{name}</a>'
