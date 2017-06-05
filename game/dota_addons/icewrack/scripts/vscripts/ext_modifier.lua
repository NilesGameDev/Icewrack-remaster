--[[
    Icewrack Extended Modifier
]]

require("mechanics/status_effects")

if not CExtModifier then

local stExtModifierData = LoadKeyValues("scripts/npc/npc_modifiers_extended.txt")

local tIndexTableList = {}
CExtModifier = setmetatable({}, { __call = 
	function(self, hModifier)
		if not IsInstanceOf(hModifier, CDOTA_Buff) then
			error("[CExtModifier]: Tried to create an extended modifier from non-modifier data", LOG_SEVERITY_ERROR)
		elseif hModifier._bIsExtendedModifier then
			return hModifier
		end
		
		local tBaseIndexTable = getmetatable(hModifier).__index
		local tExtIndexTable = tIndexTableList[tBaseIndexTable]
		if not tExtIndexTable then
			tExtIndexTable = ExtendIndexTable(hModifier, CExtModifier)
			tIndexTableList[tBaseIndexTable] = tExtIndexTable
		end
		setmetatable(hModifier, tExtIndexTable)
		
		local szAbilityName = hModifier:GetAbility():GetName()
		local szModifierName = hModifier:GetName()
		
		local tExtAbilityTemplate = stExtModifierData[szAbilityName] or {}
		local tExtModifierTemplate = tExtAbilityTemplate[szModifierName]
		LogAssert(tExtModifierTemplate, "Failed to load template \"%d\" - no data exists for this entry.", szModifierName)
		
		hModifier._bIsExtendedModifier = true
		hModifier._bIsLuaModifier = hModifier.OnCreated and true or false
		hModifier._szAbilityName = szAbilityName
		
		hModifier._nModifierEntityFlags = GetFlagValue(tExtModifierTemplate.ModifierEntityFlags, stExtEntityFlagEnum)
		hModifier._bIsDispellable = tExtModifierTemplate.IsDispellable == 1
		hModifier._bIsStrict =  tExtModifierTemplate.IsStrict == 1
		
		if hModifier._fMinDuration and hModifier._fMaxDuration and hModifier._fMinDuration > hModifier._fMaxDuration then
			local fTemp = hModifier._fMinDuration
			hModifier._fMinDuration = hModifier._fMaxDuration
			hModifier._fMaxDuration = fTemp
		end
		
		local hTarget = hModifier:GetParent()
		if hTarget._bIsLuaModifier and hTarget._bIsExtendedEntity then
			hModifier:OnCreated({})
		end
		return hModifier
	end})

function CExtModifier:GetAbilityName()
	return self._szAbilityName
end

function CExtModifier:GetUnitFlags()
	return self._nModifierEntityFlags
end

function CExtModifier:IsDispellable()
	return self._bIsDispellable
end

function CExtModifier:IsStrict()
	return self._bIsStrict
end

function CExtModifier:GetRealDurationMultiplier(hTarget)
	local hSource = self:GetCaster()
	local fDurationMultiplier = 1.0
	if self:IsDebuff() then
		fDurationMultiplier = hTarget:GetSelfDebuffDuration()
		if self:GetModifierClass() == IW_MODIFIER_CLASS_PHYSICAL then
			fDurationMultiplier = fDurationMultiplier * (100 * hSource:GetOtherDebuffDuration())/(100 + hTarget:GetPhysicalDebuffDefense())
		elseif self:GetModifierClass() == IW_MODIFIER_CLASS_MAGICAL then
			fDurationMultiplier = fDurationMultiplier * (100 * hSource:GetOtherDebuffDuration())/(100 + hTarget:GetMagicalDebuffDefense())
		else
			fDurationMultiplier = fDurationMultiplier * hSource:GetOtherDebuffDuration()
		end
	else
		fDurationMultiplier = hTarget:GetSelfBuffDuration() * hSource:GetOtherBuffDuration()
	end
	
	local nStatusEffect = self:GetStatusEffect()
	if nStatusEffect ~= IW_STATUS_EFFECT_NONE then
		fDurationMultiplier = fDurationMultiplier * hTarget:GetStatusEffectDurationMultiplier(nStatusEffect)
	end
	return fDurationMultiplier
end

function CExtModifier:SetDuration(fDuration, bInformClient)
	local hSource = self:GetCaster()
	local hTarget = self:GetParent()
	
	local fDurationMultiplier = 1.0
	if not self:IsStrict() then
		fDurationMultiplier = self:GetRealDurationMultiplier(hTarget)
	end
	if fDuration == -1 then
		if fDurationMultiplier == 0 then
			fDuration = 0
		end
	else
		fDuration = fDuration * math.max(0.0, fDurationMultiplier)
	end
	CDOTA_Buff.SetDuration(self, fDuration, bInformClient)
	return fDuration
end

function CExtModifier:OnEntityRefresh()
	self:RefreshModifier()
end

function IsValidExtendedModifier(hModifier)
    return (IsValidInstance(hModifier) and hModifier._bIsExtendedModifier)
end

local function RemoveBuffDummy(hDummy)
	hDummy:RemoveSelf()
end

function AddModifier(szAbilityName, szModifierName, hTarget, hSource, tModifierArgs)
	if not tModifierArgs then tModifierArgs = {} end
	local hAbility = nil
	if type(szAbilityName) == "table" then
		hAbility = szAbilityName
	else
		local hBuffDummy = CreateDummyUnit(hTarget:GetAbsOrigin(), nil, 0)
		hBuffDummy:AddAbility(szAbilityName)
		hAbility = hBuffDummy:FindAbilityByName(szAbilityName)
		hAbility:SetOwner(hSource)
		hBuffDummy.RemoveBuffDummy = RemoveBuffDummy
		hBuffDummy:SetThink("RemoveBuffDummy", hBuffDummy, "BuffDummyRemoveThink", 0.03)
	end
	
	local szClassname = hAbility:GetClassname()
	if IsInstanceOf(hAbility, CDOTA_Ability_DataDriven) or IsInstanceOf(hAbility, CDOTA_Item_DataDriven) then
		hAbility:ApplyDataDrivenModifier(hSource, hTarget, szModifierName, tModifierArgs)
	else
		hTarget:AddNewModifier(hSource, hAbility, szModifierName, tModifierArgs)
	end
	
	local hModifier = nil
	local fLastTime = -1.0
	for _,v in pairs(hTarget:FindAllModifiers()) do
		if v:GetName() == szModifierName and v:GetCreationTime() > fLastTime then
			hModifier = v
		end
	end
	return hModifier
end

end