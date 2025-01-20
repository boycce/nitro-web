<html>
<head>
  <link href='http://fonts.googleapis.com/css?family=Open+Sans:600,400,300' rel='stylesheet' type='text/css'>
  <!-- Nunjunks global defined in webpack.config -->
  <link href='partials/email.css' rel='stylesheet' type='text/css'>
</head>

<body class="email-body">

  <!-- Email body, bgcolor was F9FBFD -->
  <table width="100%" align="center" bgcolor="#ffffff" cellpadding="0" cellspacing="0" border="0">
    <tbody>
      <tr>
        <td align="center" valign="top" width="100%">

          <!-- Center container -->
          <table class="table-scale" width="610px" align="center" cellpadding="0" cellspacing="0" border="0">
            <tbody>
              <tr>
                <td>

                  <!-- Header -->
                  {% include "./vert-35.swig" %}
                  <table class="table-header" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tbody>
                      <tr>
                        <td width="100%">
                          {% include "./vert-25.swig" %}
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tbody>
                              <tr>
                                <td width="180px" align="left">
                                  <a href="%recipient.domain%" target="_blank">
                                    <img src="%recipient.domain%/assets/imgs/logo/logo-white.svg" width="auto" height="22" border="0">
                                  </a>
                                </td>
                                <td align="right">
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          {% include "./vert-25.swig" %}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- body -->
                  <table class="table-body" width="100%" bgcolor="#ffffff" cellpadding="0" cellspacing="0" border="0">
                    <tbody>
                      <tr>
                        <td width="100%" align="left">
                          {% include "./vert-50.swig" %}

                          <!-- content -->
                          <table class='table-content' cellpadding="0" cellspacing="0" border="0">
                            <tbody>
                              <tr>
                                <td style="padding-left:50px; padding-right:50px;" align="center" class="content">
                                  {% block content %}{% endblock %}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <!-- content -->

                          {% include "./vert-50.swig" %}
                          {% include "./vert-10.swig" %}
                          {% include "./vert-10.swig" %}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <!-- body -->

                  <!-- footer -->
                  {% include "./vert-30.swig" %}

                </td>
              </tr>
            </tbody>
          </table>
          <!-- Center container -->

        </td>
      </tr>
    </tbody>
  </table>
  <!-- Email body -->

</body>
</html>
