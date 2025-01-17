require("mechanics/damage_types")
require("mechanics/damage_secondary")

local stShockDamageTable = 
{
	damage =
	{
		[IW_DAMAGE_TYPE_LIGHTNING] = {}
	},
}

function ApplyShock(hVictim, hAttacker, fDamagePercentHP)
	if fDamagePercentHP > 0.1 then
		stShockDamageTable.target = hVictim
		stShockDamageTable.attacker = hAttacker
		local nUnitClass = IsValidExtendedEntity(hTarget) and hTarget:GetUnitClass() or IW_UNIT_CLASS_NORMAL
		local fShockMultiplier = 0.1 + (0.15 * fDamagePercentHP)
		if nUnitClass == IW_UNIT_CLASS_ELITE then
			fShockMultiplier = 0.04 + (0.06 * fDamagePercentHP)
		elseif nUnitClass == IW_UNIT_CLASS_BOSS or nUnitClass == IW_UNIT_CLASS_ACT_BOSS then
			fShockMultiplier = 0.02 + (0.03 * fDamagePercentHP)
		end
		
		stShockDamageTable.damage[IW_DAMAGE_TYPE_LIGHTNING].min = hVictim:GetHealth() * fShockMultiplier
		stShockDamageTable.damage[IW_DAMAGE_TYPE_LIGHTNING].max = hVictim:GetHealth() * fShockMultiplier

		DealSecondaryDamage(nil, stShockDamageTable)
		local nParticleIndex = ParticleManager:CreateParticle("particles/generic_gameplay/generic_hit_lightning.vpcf", PATTACH_ABSORIGIN_FOLLOW, hVictim)
		ParticleManager:ReleaseParticleIndex(nParticleIndex)
		EmitSoundOn("Icewrack.Shock", hVictim)
	end
end