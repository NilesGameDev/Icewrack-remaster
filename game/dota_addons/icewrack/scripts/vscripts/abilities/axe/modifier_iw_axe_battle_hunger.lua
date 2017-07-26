modifier_iw_axe_battle_hunger = class({})

function modifier_iw_axe_battle_hunger:DeclareExtEvents()
	local funcs =
	{
		[IW_MODIFIER_EVENT_ON_KILL] = 1,
	}
	return funcs
end
	
function modifier_iw_axe_battle_hunger:OnCreated(args)
	if IsServer() then
		self._fThinkRate = args.think_rate
		self._fDuration = args.duration
		self:StartIntervalThink(self._fThinkRate)
	end
end

function modifier_iw_axe_battle_hunger:OnDestroy(args)
	if IsServer() then
		local hAbility = self:GetAbility()
		if hAbility:GetToggleState() then
			hAbility:ToggleAbility()
		end
	end
end

function modifier_iw_axe_battle_hunger:OnKill(args)
	self:ForceRefresh()
	self:SetDuration(self._fDuration, true)
	EmitSoundOn("Hero_Axe.Battle_Hunger", args.attacker)
end

function modifier_iw_axe_battle_hunger:OnIntervalThink()
	if IsServer() then
		local hEntity = self:GetParent()
		local fHealthLossPercent = self:GetAbility():GetSpecialValueFor("health_loss")/100.0
		local fHealthLoss = fHealthLossPercent * hEntity:GetMaxHealth() * self._fThinkRate
		hEntity:ModifyHealth(math.max(0, hEntity:GetHealth() - fHealthLoss), hEntity, true, 0)
	end
end