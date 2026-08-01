<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>
<qgis version="3.34.5-Prizren" styleCategories="Fields|FieldConfiguration">
  <fieldConfiguration>
    <field name="fid">
      <editWidget type="Range">
        <config>
          <Option type="Map">
            <Option name="AllowNull" type="bool" value="true" />
            <Option name="Max" type="int" value="2147483647" />
            <Option name="Min" type="int" value="-2147483648" />
            <Option name="Step" type="int" value="1" />
            <Option name="Style" type="QString" value="SpinBox" />
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="calle">
      <editWidget type="TextEdit">
        <config>
          <Option type="Map">
            <Option name="IsMultiline" type="bool" value="false" />
            <Option name="UseHtml" type="bool" value="false" />
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="entre_calle_1">
      <editWidget type="TextEdit">
        <config>
          <Option type="Map">
            <Option name="IsMultiline" type="bool" value="false" />
            <Option name="UseHtml" type="bool" value="false" />
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="entre_calle_2">
      <editWidget type="TextEdit">
        <config>
          <Option type="Map">
            <Option name="IsMultiline" type="bool" value="false" />
            <Option name="UseHtml" type="bool" value="false" />
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="lado">
      <editWidget type="ValueMap">
        <config>
          <Option type="Map">
            <Option name="map" type="List">
              <Option type="Map">
                <Option name="impar" type="QString" value="impar" />
              </Option>
              <Option type="Map">
                <Option name="par" type="QString" value="par" />
              </Option>
            </Option>
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="tipo">
      <editWidget type="ValueMap">
        <config>
          <Option type="Map">
            <Option name="map" type="List">
              <Option type="Map">
                <Option name="motos" type="QString" value="motos" />
              </Option>
              <Option type="Map">
                <Option name="prohibido" type="QString" value="prohibido" />
              </Option>
              <Option type="Map">
                <Option name="vehiculos" type="QString" value="vehiculos" />
              </Option>
            </Option>
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="motivo">
      <editWidget type="ValueMap">
        <config>
          <Option type="Map">
            <Option name="map" type="List">
              <Option type="Map">
                <Option name="bocacalle" type="QString" value="bocacalle" />
              </Option>
              <Option type="Map">
                <Option name="rampa" type="QString" value="rampa" />
              </Option>
              <Option type="Map">
                <Option name="subida_privada" type="QString" value="subida_privada" />
              </Option>
              <Option type="Map">
                <Option name="otro" type="QString" value="otro" />
              </Option>
              <Option type="Map">
                <Option name="(vacío)" type="QString" value="" />
              </Option>
            </Option>
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="arranque_m">
      <editWidget type="TextEdit">
        <config>
          <Option type="Map">
            <Option name="IsMultiline" type="bool" value="false" />
            <Option name="UseHtml" type="bool" value="false" />
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="largo_m">
      <editWidget type="TextEdit">
        <config>
          <Option type="Map">
            <Option name="IsMultiline" type="bool" value="false" />
            <Option name="UseHtml" type="bool" value="false" />
          </Option>
        </config>
      </editWidget>
      <defaultValue>round(length($geometry)/0.5,0)*0.5</defaultValue>
      <defaultValueOnUpdate>round(length($geometry)/0.5,0)*0.5</defaultValueOnUpdate>
    </field>
    <field name="capacidad">
      <editWidget type="Range">
        <config>
          <Option type="Map">
            <Option name="AllowNull" type="bool" value="true" />
            <Option name="Max" type="int" value="2147483647" />
            <Option name="Min" type="int" value="-2147483648" />
            <Option name="Step" type="int" value="1" />
            <Option name="Style" type="QString" value="SpinBox" />
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="horario">
      <editWidget type="TextEdit">
        <config>
          <Option type="Map">
            <Option name="IsMultiline" type="bool" value="false" />
            <Option name="UseHtml" type="bool" value="false" />
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="tarifa">
      <editWidget type="TextEdit">
        <config>
          <Option type="Map">
            <Option name="IsMultiline" type="bool" value="false" />
            <Option name="UseHtml" type="bool" value="false" />
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="senializacion">
      <editWidget type="TextEdit">
        <config>
          <Option type="Map">
            <Option name="IsMultiline" type="bool" value="false" />
            <Option name="UseHtml" type="bool" value="false" />
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="observaciones">
      <editWidget type="TextEdit">
        <config>
          <Option type="Map">
            <Option name="IsMultiline" type="bool" value="true" />
            <Option name="UseHtml" type="bool" value="false" />
          </Option>
        </config>
      </editWidget>
    </field>
    <field name="origen">
      <editWidget type="TextEdit">
        <config>
          <Option type="Map">
            <Option name="IsMultiline" type="bool" value="false" />
            <Option name="UseHtml" type="bool" value="false" />
          </Option>
        </config>
      </editWidget>
    </field>
  </fieldConfiguration>
</qgis>
